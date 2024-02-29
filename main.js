var isButtonClicked = false;

function myFunction() { //debounce isbuttonclicked doesnt work find fix for tigs
    if (isButtonClicked) {
        return;
    }
    // script.js
    isButtonClicked = true;
    var textElement = document.getElementById("myText");
    
    // Change the text
    textElement.innerText = "I'm hungry as heck, give me food, please!";

    // Display the text
    textElement.style.display = "block";

    // Set a timeout to revert the text after 2 seconds
    setTimeout(function() {
        textElement.innerText = "Original Text";
        textElement.style.display = "none";
        isButtonClicked = false; // Reset isButtonClicked to false after the timeout
    }, 2000);
}
