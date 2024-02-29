function myFunction() {
    var textElement = document.getElementById("myText");
    
    // Change the text
    textElement.innerText = "Im hungry as fuck gimme food pls!";

    // Display the text
    textElement.style.display = "block";

    // Set a timeout to revert the text after 2 seconds
    setTimeout(function() {
        textElement.innerText = "Original Text";
        textElement.style.display = "none";
    }, 2000);
}
