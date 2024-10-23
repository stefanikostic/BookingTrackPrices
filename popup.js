document.getElementById("pick-element-btn").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      files: ["content.js"],
    });
  });
});

const SELECTED_ACCOMMODATIONS_KEY = "selectedAccommodations";
const BOOKINGS_ELEMENT_ID = "bookings";
const BOOKING_SEARCH_RESULTS_URL = "https://www.booking.com/searchresults.html";
const SEARCH_STRING = "ss";
const CHECK_IN = "checkin";
const CHECK_OUT = "checkout";
const NUMBER_OF_ADULTS = "group_adults";
const NUMBER_OF_ROOMS = "no_rooms";
const NUMBER_OF_CHILDREN = "group_children";

const DEFAULT_NUMBER_OF_ADULTS = 2;
const DEFAULT_NUMBER_OF_ROOMS = 1;
const DEFAULT_NUMBER_OF_CHILDREN = 0;

function processSelectedBookings() {
  chrome.storage.local.get([SELECTED_ACCOMMODATIONS_KEY], (result) => {
    document.getElementById(BOOKINGS_ELEMENT_ID).innerHTML = "";

    const selectedAccommodations = result.selectedAccommodations;

    console.log("selectedAccommodationsPopup", selectedAccommodations);
    if (selectedAccommodations && selectedAccommodations.length != 0) {
      constructUIForAccommodations(selectedAccommodations);
    } else {
      hideSpinner();
    }
  });
}

function constructUIForAccommodations(selectedAccommodations) {
  for (let i = 0; i < selectedAccommodations.length; i++) {
    let selectedAccommodation = selectedAccommodations[i];
    const bookingSearchResultsUrlObj = new URL(BOOKING_SEARCH_RESULTS_URL);
    bookingSearchResultsUrlObj.searchParams.set(
      SEARCH_STRING,
      selectedAccommodation.bookingPropertyName
    );
    bookingSearchResultsUrlObj.searchParams.set(
      CHECK_IN,
      selectedAccommodation.startDate
    );
    bookingSearchResultsUrlObj.searchParams.set(
      CHECK_OUT,
      selectedAccommodation.endDate
    );
    bookingSearchResultsUrlObj.searchParams.set(
      NUMBER_OF_ADULTS,
      selectedAccommodation.numberOfAdults
        ? selectedAccommodation.numberOfAdults
        : DEFAULT_NUMBER_OF_ADULTS
    );
    bookingSearchResultsUrlObj.searchParams.set(
      NUMBER_OF_ROOMS,
      selectedAccommodation.numberOfRooms
        ? selectedAccommodation.numberOfRooms
        : DEFAULT_NUMBER_OF_ROOMS
    );
    bookingSearchResultsUrlObj.searchParams.set(
      NUMBER_OF_CHILDREN,
      selectedAccommodation.numberOfChildren
        ? selectedAccommodation.numberOfChildren
        : DEFAULT_NUMBER_OF_CHILDREN
    );

    fetch(bookingSearchResultsUrlObj.href)
      .then((response) => response.text())
      .then((data) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(data, "text/html");
        const propertyCard = doc.querySelector(
          '[data-testid="property-card"]'
        );

        let oldPrice = selectedAccommodation.price;
        let updatedPrice = extractAccommodationDetails(propertyCard);
        let priceElement = constructPriceElement(updatedPrice, oldPrice);

        hideSpinner();

        document.getElementById(BOOKINGS_ELEMENT_ID).innerHTML +=
          `<li>
            <div class="card booking-card my-2">
            <div class="row">
              <div class="col-4">
                <img class="property-image card-img-top" src="${selectedAccommodation.imgSource}" alt="Property Image">
              </div>
              <div class="col-5 my-2 p-0 d-flex flex-column">
                <h6 class="card-title display-6 mb-0">${selectedAccommodation.bookingPropertyName}</h6>
              
                <div class="mt-auto">  
                  <p class="card-subtitle room-type">${selectedAccommodation.roomType}</p>
                  <p class="card-text dates mt-auto">Start Date: ${selectedAccommodation.startDate}</p>
                  <p class="card-text dates mt-auto">End Date: ${selectedAccommodation.endDate}</p>
                </div>
              </div>` +
          `<div class="col-3 d-flex flex-column">
                <button class="remove-property-button align-self-end" accommodation-id="${i}">&times;</button>` +
          priceElement +
          `</div></div></div></li>`;
      })
      .finally(() => {
        setRemoveButtonListener(selectedAccommodations);
      });
  }
}

function hideSpinner() {
  document.getElementById(BOOKINGS_ELEMENT_ID).classList.remove("hidden");
  document.getElementById("spinner-row").classList.remove("my-2");
  document.getElementById("spinner").classList.add("hidden");
}

function constructPriceElement(updatedPrice, oldPrice) {
  let priceElement = "";
  if (updatedPrice === null) {
    return `<div class="not-available-property align-self-end mt-auto mb-2 mr-2">
              <span class="text-secondary">Not available</span>
              </div>`;
  }
  
  if (updatedPrice > oldPrice) {
    priceElement = `<div class="align-self-end mt-auto mb-2 mr-2">
                  <span class="arrow-up">&#8593;</span>
                  <span class="updated-price">${updatedPrice}</span>
                  <span class="old-price">${oldPrice}</span>
                </div>`;
  } else if (updatedPrice < oldPrice) {
      priceElement = `<div class="align-self-end mt-auto mb-2 mr-2">
                  <span class="arrow-down">&#8595;</span>
                  <span class="updated-price">${updatedPrice}</span>
                  <span class="old-price">${oldPrice}</span>
                </div>`;
  } else {
      priceElement = `<div class="align-self-end mt-auto mb-2 mr-2">
                <span class="arrow-down">&#8595;</span>
                <span class="updated-price">${updatedPrice}</span>
              </div>`;
  }
  return priceElement;
}

function setRemoveButtonListener(selectedAccommodations) {
  let removePropertyButtons = document.getElementsByClassName("remove-property-button");
  for (let j = 0; j < removePropertyButtons.length; j++) {
    let removePropertyButton = removePropertyButtons[j];

    removePropertyButton.addEventListener("click", (event) => {
      event.preventDefault();
      let selectedAccommodationId = removePropertyButton.getAttribute("accommodation-id");
      selectedAccommodations.splice(selectedAccommodationId, 1);
      chrome.storage.local.set({
        selectedAccommodations: selectedAccommodations,
      });

      document.getElementById(BOOKINGS_ELEMENT_ID).classList.add("hidden");
      document.getElementById("spinner-row").classList.add("my-2");
      document.getElementById("spinner").classList.remove("hidden");

      processSelectedBookings();
    });
  }
}

function extractAccommodationDetails(propertyCard) {
  let priceElement = propertyCard.querySelector(
    '[data-testid="price-and-discounted-price"]'
  );

  return priceElement && priceElement.innerText;
}

processSelectedBookings();
