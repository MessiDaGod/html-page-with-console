class ShakelyConsole {

    constructor() { }

    get console_element() {
        return document.getElementById("simple")
    };

    
console_element.className = "simple-console";

var output = document.createElement("div");
output.className = "simple-console-output";
output.setAttribute("role", "log");
output.setAttribute("aria-live", "polite");

var input_wrapper = document.createElement("div");
input_wrapper.className = "simple-console-input-wrapper";
add_chevron(input_wrapper);

var input = document.createElement("input");
input.className = "simple-console-input";
input.setAttribute("autofocus", "autofocus");
input.setAttribute("placeholder", placeholder);
input.setAttribute("aria-label", placeholder);

console_element.appendChild(output);
if (!output_only) {
    console_element.appendChild(input_wrapper);
}
input_wrapper.appendChild(input);
}