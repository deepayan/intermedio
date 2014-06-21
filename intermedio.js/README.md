
# Goal

We want to implement a basic set of primitives like tessella.  Let's
even call it tessella.

We need something for layout and object management, some graphical
primitives, and then eventually a high level API and support for
interaction.


## Conventions

When porting from tessella, we will try to stick to R's idioms as much
as possible.  For simple R objects (list + class attribute + no useful
inheritance), the class attribute will be replaced by a Object element
called 'rclass'.

 
