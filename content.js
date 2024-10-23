function setupListeners() {
  let propertyCards = document.querySelectorAll('[data-testid="property-card"]');

  for (let i = 0; i < propertyCards.length; i++) {
    setupClickListener(propertyCards, i);
    setupMouseOverListener(propertyCards, i);
    setupMouseOutListener(propertyCards, i);
  }
}

function setupClickListener(propertyCards, i) {
  propertyCards[i].addEventListener("click", function (event) {
    const clickedPropertyCard = event.target;

    console.log('clickedPropertyCard', clickedPropertyCard);
    let propertyCardDataTestIdAttribute = clickedPropertyCard.getAttribute("data-testid");
    if (propertyCardDataTestIdAttribute === "property-card") {
      clickedPropertyCard.style.outline = "";

      let accommodationDetails = extractAccommodationDetails(clickedPropertyCard);

      console.log("local storage", chrome.storage.local);
      chrome.storage.local.get(["selectedAccommodations"], (result) => {
        let selectedAccommodations = result["selectedAccommodations"];

        if (!Array.isArray(selectedAccommodations)) {
          selectedAccommodations = [accommodationDetails];
        } else {
          let duplicateAccommodation = selectedAccommodations.find(
            (selectedAccommodation) =>
              selectedAccommodation.bookingPropertyName === accommodationDetails.bookingPropertyName &&
              selectedAccommodation.roomType === accommodationDetails.roomType &&
              selectedAccommodation.startDate === accommodationDetails.startDate &&
              selectedAccommodation.endDate === accommodationDetails.endDate &&
              selectedAccommodation.numberOfRooms === accommodationDetails.numberOfRooms &&
              selectedAccommodation.numberOfAdults === accommodationDetails.numberOfAdults &&
              selectedAccommodation.numberOfChildren === accommodationDetails.numberOfChildren
          );

          if (!duplicateAccommodation) {
            selectedAccommodations.push(accommodationDetails);
          }
        }

        chrome.storage.local.set({
          selectedAccommodations: selectedAccommodations,
        });
      });
    } 
  });
}

function setupMouseOverListener(propertyCards, i) {
  propertyCards[i].addEventListener("mouseover", function (event) {
    const mouseOverElement = event.target;

    let propertyCardDataTestIdAttribute =
      mouseOverElement.getAttribute("data-testid");

    if (propertyCardDataTestIdAttribute === "property-card") {
      mouseOverElement.style.outline = "3px solid #17A2B8";
    }
  });
}

function setupMouseOutListener(propertyCards, i) {
  propertyCards[i].addEventListener("mouseout", function (event) {
    const mouseOutElement = event.target;

    let propertyCardDataTestIdAttribute =
      mouseOutElement.getAttribute("data-testid");

    if (propertyCardDataTestIdAttribute === "property-card") {
      mouseOutElement.style.outline = "";
    }
  });
}

function extractAccommodationDetails(element) {
  let titleElement = element.querySelector('[data-testid="title"]');
  let bookingPropertyName = titleElement && titleElement.innerText;

  let roomTypeHeaderElement = element.querySelector("h4");
  let roomType = roomTypeHeaderElement && roomTypeHeaderElement.innerText;

  let priceElement = element.querySelector('[data-testid="price-and-discounted-price"]');
  let price = priceElement && priceElement.innerText;

  let imgElement = element.querySelector('[data-testid="image"]');
  let imgSource = imgElement.getAttribute("src");
  let searchURLObject = new URL(window.location.href);
  let searchParams = new URLSearchParams(searchURLObject.search);

  let startDate = searchParams.get("checkin");
  let endDate = searchParams.get("checkout");
  let numberOfRooms = searchParams.get("no_rooms");
  let numberOfAdults = searchParams.get("group_adults");
  let numberOfChildren = searchParams.get("group_children");

  return {
    bookingPropertyName: bookingPropertyName,
    roomType: roomType,
    price: price,
    startDate: startDate,
    endDate: endDate,
    numberOfAdults: numberOfAdults,
    numberOfChildren: numberOfChildren,
    numberOfRooms: numberOfRooms,
    imgSource: imgSource,
  };
}

setupListeners();
