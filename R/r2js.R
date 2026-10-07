# r2js.R
# Initial prototype of an R-to-JS AST transpiler

r2js <- function(expr) {
  # Base cases: primitives and symbols
  if (is.atomic(expr)) {
    if (is.null(expr)) return("null")
    if (is.logical(expr)) return(tolower(as.character(expr)))
    if (is.character(expr)) return(paste0('"', expr, '"'))
    if (is.numeric(expr)) return(as.character(expr))
    return(as.character(expr))
  }
  
  if (is.name(expr) || is.symbol(expr)) {
    return(as.character(expr))
  }
  
  # Function calls and complex expressions
  if (is.call(expr)) {
    fn_name <- as.character(expr[[1]])
    
    # Handle blocks
    if (fn_name == "{") {
      args <- as.list(expr)[-1]
      js_args <- vapply(args, r2js, character(1))
      return(paste0("{\n  ", paste(js_args, collapse = ";\n  "), "\n}"))
    }
    
    # Handle assignment
    if (fn_name == "<-" || fn_name == "=") {
      lhs <- r2js(expr[[2]])
      rhs <- r2js(expr[[3]])
      # For now, simply assign without 'var' or 'let' unless we do scope tracking,
      # but let's assume it's just a raw assignment.
      return(paste0(lhs, " = ", rhs))
    }
    
    # Handle standard binary operators by translating to Rstatic vectorized functions
    bin_ops <- list(
      "+" = "Rstatic.sum2",     # Note: using interstat's existing sum2 or a new Rstatic.add
      "-" = "Rstatic.sub",
      "*" = "Rstatic.mult",
      "/" = "Rstatic.div",
      "==" = "Rstatic.eq",
      "<" = "Rstatic.lt",
      ">" = "Rstatic.gt"
    )
    
    if (fn_name %in% names(bin_ops)) {
      lhs <- r2js(expr[[2]])
      rhs <- r2js(expr[[3]])
      js_func <- bin_ops[[fn_name]]
      return(paste0(js_func, "(", lhs, ", ", rhs, ")"))
    }
    
    # Handle 'if'
    if (fn_name == "if") {
      cond <- r2js(expr[[2]])
      true_branch <- r2js(expr[[3]])
      if (length(expr) > 3) {
        false_branch <- r2js(expr[[4]])
        return(paste0("if (", cond, ") ", true_branch, " else ", false_branch))
      } else {
        return(paste0("if (", cond, ") ", true_branch))
      }
    }
    
    # Handle 'for'
    if (fn_name == "for") {
      var <- r2js(expr[[2]])
      seq <- r2js(expr[[3]])
      body <- r2js(expr[[4]])
      # A simple approach for JS `for...of` or mapping
      # We'll map `for (i in seq)` to something similar in JS.
      # JS ES6: `for (let i of seq)`
      return(paste0("for (let ", var, " of ", seq, ") ", body))
    }
    
    # Handle function definitions
    if (fn_name == "function") {
      args <- names(expr[[2]])
      args_str <- paste(args, collapse = ", ")
      body <- r2js(expr[[3]])
      return(paste0("function(", args_str, ") ", body))
    }
    
    # General function calls
    args <- as.list(expr)[-1]
    js_args <- vapply(args, r2js, character(1))
    
    # Map common R functions to Rstatic equivalents
    rstatic_funcs <- c("mean", "abs", "ifelse", "sqrt", "exp", "log", "max", "min", "range", "length")
    if (fn_name %in% rstatic_funcs) {
      fn_name <- paste0("Rstatic.", fn_name)
    }
    
    return(paste0(fn_name, "(", paste(js_args, collapse = ", "), ")"))
  }
  
  stop("Unsupported expression type")
}

# Wrapper for translating function definitions
transpile_function <- function(fn, fn_name = "anonymous") {
  expr <- body(fn)
  args <- names(formals(fn))
  args_str <- paste(args, collapse = ", ")
  js_body <- r2js(expr)
  paste0("var ", fn_name, " = function(", args_str, ") ", js_body, ";")
}

# Example test
test_fn <- function(x, y) {
  z <- x + y
  if (z > 10) {
    result <- z * 2
  } else {
    result <- z / 2
  }
  return(result)
}

cat(transpile_function(test_fn, "test_fn"), "\n")
