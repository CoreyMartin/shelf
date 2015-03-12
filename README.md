# shelf.js
CSS and JavaScript utilities snippet for Chrome Devtools

You can add shelf.js as a snippet to Chrome devtools or just paste it into the console for a page and the shelf object will remain available for as long as devtools stays open.

Shelf is just meant to be a collection of utilities I put together and find useful when debugging and trying out new things on web pages.

The css method is used for quickly displaying all of the active CSS rules that match a selector. So shelf.css('div') will return an object with all of the applied style rules for divs including divs with additional classes.

I typically use the css method with the objdiff method to easily store and display differences in applied styles at different times. Otherwise it can be difficult to quickly spot style differences using devtools alone, especially if there's a lot that stays the same between states. objdiff easily spots the difference for you:

> a = shelf.css('div')

> Object {width: "200px", height: "200px", background-color: "green", display: "inline-block"}

// several clicks / DOM changes later ...

> b = shelf.css('div')

> Object {width: "200px", height: "initial", background-color: "green", display: "inline-block"}

> shelf.objdiff( a, b )

> Object {height:"initial"}

This is a really simple example - the benefits are more easily seen when dealing with elements that have dozens of styles applied to them.