# intermedio/R/yplot_web.R
# R Wrapper to simulate the plotting frontend and generate the JS payload.

source("R/r2js.R")
library(jsonlite)

## 1. Define the custom panel function
mypanel.scatter <- function(x, y, subscripts, vp, sceneGraph, gpar) {
    x_diff <- x - mean(x) 
    is_outlier <- abs(x_diff) > 1.5
    my_colors <- ifelse(is_outlier, "red", "steelblue")
    console.log(my_colors);
    gpar$stroke <- "white"
    gpar$fill <- my_colors
    cp.tpoints(x, y, subscripts, vp, sceneGraph, gpar)
  }


yplot_web <- function(panel = mypanel.scatter) {
  
  # 2. Transpile the R function
  # We name it 'panel_custom_scatter' so JS can call window.panel_custom_scatter
  js_panel_code <- transpile_function(panel, "panel_custom_scatter")
  
  # 3. Simulate Data Grouping (like yagpack compute.packets)
  data_full <- iris
  levels_species <- levels(data_full$Species)
  
  packets <- lapply(levels_species, function(lvl) {
    which(data_full$Species == lvl) - 1  # 0-indexed for Javascript
  })

  # 4. Assemble Payload
  payload <- list(
    data = list(
      Sepal_Length = data_full$Sepal.Length,
      Sepal_Width = data_full$Sepal.Width,
      x = data_full$Sepal.Length, # Standardized key for JS
      y = data_full$Sepal.Width,  # Standardized key for JS
      Species = as.character(data_full$Species)
    ),
    panels = packets,
    panelNames = levels_species,
    panel_function_name = "panel_custom_scatter"
  )

  # Convert to JSON
  json_out <- toJSON(payload, auto_unbox = TRUE, pretty = TRUE)
  
  # 5. Write to payload.js
  out_str <- paste0(js_panel_code, "\n\n", "var payloadData = ", json_out, ";\n")
  writeLines(out_str, "payload.js")
  
  cat("Successfully generated payload.js\n")
  cat("Open intermedio/index.html in your browser to view the interactive plot.\n")
}

# Run the generation script
yplot_web()
