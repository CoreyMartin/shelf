function Shelf(){
    var _, $, self = this;
    this.init = function(){
        this.loadScript("https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.2/underscore-min.js");
        _ = this._;
        // temporarily store existing jquery to prevent overwriting
        if (!_.isUndefined(window.$)) { var temp = window.$.noConflict(); }
        this.loadScript("https://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.3/jquery.min.js");
        this.$ = window.$.noConflict(); // namespace jquery
        if (!_.isUndefined(temp)) { window.$ = temp.noConflict(); } // restore previous version
        $ = this.$;
    };
    this.loadScript = function(url) {
        // load script using eval within context of Shelf object so anything previously 
        // loaded into Shelf like jQuery will be available to the script.
        var evalScript = function(){ evalContext(this.responseText, self) },
            evalContext = function(js, context) {
                // http://stackoverflow.com/a/25859853
                return function() { return eval(js); }.call(context);
            },
            x = new XMLHttpRequest();
        x.open('GET', url, false); // false to async
        x.onload = evalScript;
        x.send();
    };
    this.loadStyle = function(styleText) {
        // use this function to load many styles to the document at once, e.g. from a CSS file
        var tag = document.createElement('style');
        tag.appendChild(document.createTextNode(styleText));
        document.head.appendChild(tag);
    },
    this.loadCORSStyle = function(url) {
        // will try to load stylesheet from another domain
        // fails unless resource has CORS access
        var handle = function(){
          self.loadStyle(this.responseText);
        },
        x = new XMLHttpRequest();
        x.open('GET', url, false); // false to async
        x.onload = handle;
        x.send();
    },
    this.rulesApplyToSelector = function(rules, el) {
        // loop through CSSRuleList and return rules that match (are applied to) elements matching el
        // see https://developer.mozilla.org/en-US/docs/Web/API/CSS for the spec
        if (_.isUndefined(rules) || _.isUndefined(el)) { return }
        if (!(rules instanceof CSSRuleList)) { throw("Function only supports CSSRuleList; received " + rules.contructor.name) }
        var unsupportedPseudos = ["before", "hover", "after", "-webkit", "visited", "active"],
            supportedSelector = function(s) {
                // $().is() is unable to detect based on pseudo classes like :before
                // if the selector matches list return false
                var supported = true;
                _.each(unsupportedPseudos, function(i, j){
                    var reg = new RegExp('.*\:' + i + '.*');
                    if (s.match(reg)) { supported = false }
                }, this);
                return supported;
            }, o = {}, selector;

        for (var r in rules) {
            if (rules.hasOwnProperty(r) && r !== "length") {
                var rule = rules[r];
                if (rule instanceof CSSStyleRule || rule instanceof CSSPageRule) { 
                    selector = rules[r].selectorText;
                    if (selector.length > 1000) { console.log("Selector too long (" + selector.length + " characters)"); continue }

                    if (supportedSelector(selector) && $(el).is(selector)) {
                        o = $.extend(o, this.css2obj(rules[r].style), this.css2obj($(el).attr('style')));
                    }
                } else if (rule instanceof CSSMediaRule || rule instanceof CSSKeyframesRule) {
                    o = $.extend( o, this.rulesApplyToSelector(rule.cssRules) );
                } else if (rule instanceof CSSFontFaceRule || rule instanceof CSSKeyframeRule) { 
                    console.log("Ignoring non-selector rule " + rule.constructor.name);
                } else {
                    console.log(rule.constructor.name + " is not a supported class.");
                }
            }
        }
        return o; 
    };
    this.css = function(a) {
        // get applied css styles for a given selector
        var sheets = document.styleSheets, o = {};
        for (var i in sheets) {
            if (sheets.hasOwnProperty(i)) {
                var rules = sheets[i].cssRules, href = sheets[i].href;
                // see http://goo.gl/njW1Xd - cssRules remains null if the css file is on another domain
                if (rules === null && href !== null) { this.loadCORSStyle(href); }
                $.extend(o, this.rulesApplyToSelector(rules, a));
            }
        }
        return o;
    };
    this.css2obj = function(css) {
        if (_.isUndefined(css)) { return }
        var o = {}, appliedProp;
        if (css instanceof CSSStyleDeclaration) {
            for (var key in css) {
                if (!isNaN(key)) {
                    appliedProp = css[css[key]];
                    o[(css[key])] = appliedProp;
                } else { break }
            }
        } else if (typeof css == "string") {
            css = css.split("; ");
            for (var i in css) {
                var l = css[i].split(": ");
                o[l[0].toLowerCase()] = (l[1]);
            }
        }
        return o;
    };
    this.objDiff = function(prev, now) {
        // from http://goo.gl/8GOFJ1
        var changes = {};
        for (var prop in now) {
            if (!prev || prev[prop] !== now[prop]) {
                if (typeof now[prop] == "object") {
                    var c = this.objDiff(prev[prop], now[prop]);
                    if (! _.isEmpty(c) ) // underscore
                        changes[prop] = c;
                } else {
                    changes[prop] = now[prop];
                }
            }
        }
        return changes;
    };
    this.allCss = function(sel, asJSON) {
        if (typeof(asJSON) === 'undefined') { asJSON = false; }
        var css = {};
        $(sel).filter(function(index){
            var tag = $(this).prop("tagName") || '', id = $(this).attr("id") || '', classes = $(this).attr("class") || '',
                key = index+ " " +tag+ "#" +id+ "." +classes,
                el = {};
            el[key] = self.css($(this));
            $.extend(css, el);
        });
        if (asJSON) { return JSON.stringify(css); }
        return css;
    };
    this.init();
    return this;
};

shelf = new Shelf();