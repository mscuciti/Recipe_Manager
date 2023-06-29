// ==UserScript==
// @name         Recipe Manager Utility
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Filter recipes, save as data structures. Compile ingredients to shopping list. Browser-based "meal-lime"...
// @author       Savlian M.
// @match        *://*/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function () {
  var recipe_cards = {
    // parse various schema
    ".tasty-recipes": {
      title: function () {
        return document.querySelector(".tasty-recipes-title").outerText;
      },
      yield: function () {
        return document.querySelector(".tasty-recipes-yield").outerText;
      },
      picture: function () {
        return document
          .querySelector(".tasty-recipes-image")
          .getElementsByTagName("img")[0]
          .getAttribute("data-src");
      },
      description: function () {
        return document.querySelector(".tasty-recipes-description-body")
          .outerText;
      },
      ingredients: function () {
        let ingredients = {};
        let body = document.querySelector(".tasty-recipes-ingredients-body");
        let headings = body.getElementsByTagName("h4");
        let lists = body.getElementsByTagName("ul");
        let i = 0;
        for (let entry of lists) {
          ingredients[headings[i].outerText] = {};
          for (let nodes of entry.children)
            for (let node of nodes.children)
              if (node.hasAttribute("data-amount")) {
                let item = nodes.getElementsByTagName("strong")[0].outerText;
                ingredients[headings[i].outerText][item] = {
                  quantity: node.getAttribute("data-amount"),
                  unit: node.getAttribute("data-unit")
                };
                break;
              }
          i++;
        }
        return ingredients;
      },
      ingredients_raw: function () {
        return document.querySelector(".tasty-recipes-ingredients-body")
          .outerText;
      },
      instructions: function () {
        let instructions = [];
        let lists = document
          .querySelector(".tasty-recipes-instructions-body")
          .getElementsByTagName("li");
        for (let list of lists) instructions.push(list.outerText);
        return instructions;
      },
      notes: function () {
        let notes = [];
        let lists = document
          .querySelector(".tasty-recipes-notes-body")
          .getElementsByTagName("li");
        for (let list of lists) notes.push(list.outerText);
        return notes;
      }
    },
    ".wprm-recipe-container": {
      ingredients: function () {},
      ingredients_raw: function () {},
      instructions: function () {}
    }
  };

  var shop = {
    list: {},
    add: function () {},
    rem: function () {}
  };

  var pantry = {
    ingredients: {
      confectionary: {
        "unsalted butter": {
          quantity: "1",
          unit: "cup"
        },
        "granulated sugar": {
          quantity: "0.5",
          unit: "cup"
        }
      },
      add: function () {},
      rem: function () {}
    }
  };
  // credit: https://github.com/sean-public/RecipeFilter
  /*
  var recipe_selectors = [
    ".recipe-callout",
    ".tasty-recipes",
    "tabbox",
    ".easyrecipe",
    ".innerrecipe",
    ".recipe-summary.wide", // thepioneerwoman.com
    ".wprm-recipe-container",
    ".recipe-content",
    ".simple-recipe-pro",
    ".mv-recipe-card",
    'div[itemtype="http://schema.org/Recipe"]',
    'div[itemtype="https://schema.org/Recipe"]'
  ];
*/

  function styleSheet() {
    let sty = document.createElement("style");
    sty.innerText = `
      .recipe, .shop, .pantry {
        position: absolute;
        margin: 0 0 0 0;
      }
      .paddiv {
        padding: 0 5% 0 5%;
      }
      .title {
        text-align: center;
        margin: 5%
      }
      img {
        display: block;
        margin-left: auto;
        margin-right: auto;
        margin-bottom: 10%;
        margin-top: 10%;
        width: 100%;
      }
      details.list {
        margin-left: 5%;
      }
      .hl1, .hl2, .hl3, .hl4 {
        margin-left: 10%;
      }
      .hl1 {
        background-color: #aaaaaa; // light grey
      }
      .hl2 {
        background-color: yellow;
      }
      .hl3 {
        background-color: #888888;
      }
      .hl4 {
        background-color: #aaaa00;
      }
      .recipe-data {
        backgroud-color: inherit;
      }
      .shop-data {
        backgroud-color: inherit;
      }
      .pantry-data {
        backgroud-color: inherit;
      }
      .grandpa { 
          top: 0%; left: 0%; width: 100%; height: 100%;
          margin: 0 0 0 0;
          position-relative;
          background-color: red;
      }
      .recipe { 
          top: 0%; left: 0%; width: 50%; height: 100%;
          background-color: grey;
      }
      .shop { 
          top: 0%; left: 50%; width: 50%; height: 50%;
          background-color: green;
      }
      .pantry { 
          top: 50%; left: 50%; width: 50%; height: 50%;
          background-color: #224477;
      }
    `;
    return sty;
  }

  (function main(cards, shop, pantry) {
    let recipe = getRecipe(cards);
    UI(recipe, shop, pantry);
  })(recipe_cards, shop, pantry);

  function getRecipe(cards) {
    let selector = getSelector(cards);
    let card = cards[selector.s];
    if (selector)
      return {
        title: card.title(),
        yield: card.yield(),
        picture: card.picture(),
        description: card.description(),
        ingredients: card.ingredients(),
        instructions: card.instructions(),
        source: window.location.origin,
        notes: card.notes()
      };
    else return false;
  }

  function getSelector(selectors) {
    for (let s in selectors) {
      let found = document.querySelector(s);
      if (found) return { s: s, obj: found };
    }
    return false;
  }

  function UI(recipe, shop, pantry) {
    removeAllChildNodes(document.body);
    removeAllChildNodes(document.head);
    document.head.appendChild(styleSheet());
    document.body.appendChild(containers(recipe, shop, pantry));
  }

  function removeAllChildNodes(parent) {
    while (parent.firstChild) {
      parent.removeChild(parent.firstChild);
    }
  }

  function containers(recipe, shop, pantry) {
    let grandpa = newElement("grandpa", "div");
    grandpa.appendChild(recipeChildren(recipe, pantry));
    grandpa.appendChild(newElement("shop", "div"));
    grandpa.appendChild(newElement("pantry", "div"));
    return grandpa;
  }

  function newElement(name, tag) {
    let e = document.createElement(tag);
    e.name = name;
    e.className = name;
    return e;
  }

  // ⮜

  function recipeChildren(recipe, pantry) {
    let div = newElement("recipe", "div");
    let pad = newElement("paddiv", "div");
    // title container
    let p = pad.appendChild(newElement("title", "p"));
    // buttons and title
    p.appendChild(newButton("LButt", "@", addRecipe, [recipe]));
    let span = p.appendChild(newElement("title", "span"));
    span.innerText = recipe.title;
    p.appendChild(newButton("RButt", "⮞", remRecipe, [recipe]));
    // picture
    let img = newElement("picture", "img");
    img.src = recipe.picture;
    pad.insertBefore(img, null);
    // ingredients
    let list = ingredientsList(recipe, pantry);
    let listTitle = newElement("ingTitle", "span");
    listTitle.innerText = "Ingredients";
    pad.insertBefore(newCollapsible(listTitle, list), null);
    // instructions TODO
    // notes TODO
    // padding
    div.insertBefore(pad, null);
    return div;
  }

  function ingredientsList(recipe, pantry) {
    let mainHead = newElement("subhead", "div");
    for (let subRecipe in recipe.ingredients) {
      let sub = recipe.ingredients[subRecipe];
      let heading = newElement("head", "span");
      let list = newElement("list", "span");
      heading.innerText = subRecipe;
      for (let item in sub) {
        let ing = newElement("hl1", "span");
        let ingItem = newElement("recipe-data", "span");
        let ingQty = newElement("recipe-data", "span");
        let ingUnit = newElement("recipe-data", "span");
        ingItem.innerText = item;
        ingQty.innerText = sub[item].quantity;
        ingUnit.innerText = sub[item].unit;
        ing.insertBefore(ingItem, null);
        ing.innerHTML += ", ";
        ing.insertBefore(ingQty, null);
        ing.innerHTML += " ";
        ing.insertBefore(ingUnit, null);
        ing.innerHTML += "<br>";
        ing = ingMouseover(ing, recipe, pantry);
        list.insertBefore(ing, null);
      }
      mainHead.insertBefore(newCollapsible(heading, list), null);
    }
    return mainHead;
  }

  function ingMouseover(ing, recipe, pantry) {
    ing.addEventListener("mouseenter", (e) => {
      updateClass(e.target, recipe, pantry, "hl1", "hl2");
    });
    ing.addEventListener("mouseleave", (e) => {
      updateClass(e.target, recipe, pantry, "hl3", "hl4");
    });
    updateClass(ing, recipe, pantry, "hl3", "hl4");
    return ing;
  }

  function updateClass(e, recipe, pantry, h0, h1) {
    let item = e.getElementsByClassName("recipe-data")[0].innerText;
    let recQty = getIngredientQty(recipe.ingredients, item);
    let panQty = getIngredientQty(pantry.ingredients, item);
    if (panQty >= recQty) e.className = h0;
    else e.className = h1;
  }

  function getIngredientQty(list, ingredient) {
    let foundQty = 0;
    for (let sub in list)
      for (let ing in list[sub])
        if (ing === ingredient)
          foundQty += Number.parseFloat(list[sub][ing].quantity);
    return foundQty;
  }

  function newCollapsible(parent, child) {
    let details = newElement(child.className, "details");
    let summary = newElement(parent.className, "summary");
    details.open = true;
    summary.appendChild(parent);
    details.appendChild(child);
    details.appendChild(summary);
    return details;
  }

  function newButton(name, text, func, args) {
    let e = newElement(name, "button");
    e.innerText = text;
    e.addEventListener("click", function () {
      func.apply(null, args);
    });
    return e;
  }

  function addRecipe(recipe) {
    window.localStorage.setItem(recipe.title, JSON.stringify(recipe));
    console.log(JSON.parse(window.localStorage.getItem(recipe.title)));
  }

  function remRecipe(recipe) {
    console.log(recipe);
  }
})();
