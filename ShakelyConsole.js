'use strict';
class Log {
    constructor(val) {

        var console_element = document.getElementById("simple");
        console_element.className = "simple-console";

        var output = document.getElementById("myList");
        output.className = "no-bullets";

        const node = document.createElement("li");
        const textnode = document.createTextNode(val);
        node.appendChild(textnode);
        document.getElementById("myList").appendChild(node);
    }
}