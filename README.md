# C# Interpolated String Converter

This [extension](https://marketplace.visualstudio.com/items?itemName=corylulu.csharp-interpolated-string-converter) prepends a `$` to a string when a $ and { are entered within quotes in CSharp files (and removes the typed `$`).

Originally based on [Template String Converter](https://marketplace.visualstudio.com/items?itemName=meganrogge.template-string-converter) extension for Javascript/Typescript
## Features

Autocorrect from normal strings to interpolated strings (`$"Hello {world}"`) within CSharp files
![typing a dollar sign then open curly brace within a string converts to interpolated string](https://raw.githubusercontent.com/corylulu/csharp-interpolated-string-converter/master/demo.gif)

## Extension Settings

* `csharp-interpolated-string-converter.enable`: enable/disable this extension
