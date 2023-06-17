const ITEMS_TO_LOAD = 4;
const FAKE_LOADING_TIMEOUT = 0.7 * 1000;
const TOAST_TIMEOUT = 3 * 1000;

const bodyEl = document.getElementsByTagName("body")[0];
const cardsContainerEl = document.getElementById("cards-container");
const loadMoreButtonEl = document.getElementById("load-more-btn");
const darkModeToggleEl = document.getElementById("dark-mode-toggle");
let loadMoreIndex = 0;
let totalItemsCount = 0;
let isNoMoreItems = false;
let currentToastEl = null;
let currentToastElTimeoutId = null;
let currentLightboxElement = null;
let isDarkMode = false;

const platformColors = {
	facebook: "#1877F2",
	instagram: "#E1306C",
};

const fetchData = async (numberOfItems) => {
	try {
		const response = await fetch("./data.json");
		const data = await response.json();

		totalItemsCount = data.length;

		if (loadMoreIndex > totalItemsCount - 1) {
			throw new Error("No more items to load");
		}

		const items = data.slice(loadMoreIndex, loadMoreIndex + numberOfItems);
		loadMoreIndex = loadMoreIndex + numberOfItems;

		return items;
	} catch (e) {
		console.error(e);
		throw e;
	}
};

const getFormattedDate = (dateString) => {
	const dateObj = new Date(dateString);
	const formattedDate = dateObj
		.toLocaleDateString("en-GB")
		.split("/")
		.join("/");
	return formattedDate;
};

const getFormattedTime = (dateTimeString) => {
	const timeStr = dateTimeString.split(" ")[1];
	const formattedTime = timeStr.slice(0, 5);
	return formattedTime;
};

const getFormattedLikes = (likes) => {
	let thousands = 1000;
	let suffix = "k";
	if (likes > 999999) {
		thousands = thousands * 1000;
		suffix = "m";
	}
	return likes > 1000 ? `${(likes / thousands).toFixed(1)}${suffix}` : likes;
};

const closeLightbox = () => {
	bodyEl.removeChild(currentLightboxElement);
};

const openLightbox = (imgUrl, altText) => {
	currentLightboxElement = document.createElement("div");
	currentLightboxElement.classList = "lightbox";
	currentLightboxElement.innerHTML = `
        <img src=${imgUrl} alt="${altText} Post Image"/>
    `;
	bodyEl.appendChild(currentLightboxElement);

	currentLightboxElement.addEventListener("click", closeLightbox);
	window.addEventListener("keydown", (e) => {
		if (e.key === "Escape") closeLightbox();
	});
};

const createCardElement = (props) => {
	const dateText = `Posted on ${getFormattedDate(
		props.date
	)} at ${getFormattedTime(props.date)}`;
	const likesText = getFormattedLikes(props.likes);
	const platformText = `<span style="color: ${
		platformColors[props.source_type] || "inherit"
	}">${props.source_type}</span>`;

	// create the card header
	const cardHeaderEl = document.createElement("div");
	cardHeaderEl.classList = "card-header";
	cardHeaderEl.innerHTML = `
        <img
            src=${props.profile_image}
            alt="${props.name} Profile Picture"
            class="profile-picture"
        />
        <div class="user-info">
            <h3 class="username">${props.name}</h3>
            <p class="timestamp">${dateText}</p>
        </div>
    `;

	// create the card content
	const cardContentEl = document.createElement("div");
	cardContentEl.classList = "card-content";
	cardContentEl.innerHTML = `
        <div class="card-content">
            <p class="post-content">${props.caption}</p>
        </div>
    `;

	// create the clickable image element
	const imageEl = document.createElement("img");
	imageEl.src = props.image;
	imageEl.alt = `${props.name} Post Image`;
	imageEl.classList = "post-image";
	imageEl.addEventListener("click", () => {
		openLightbox(props.image, props.name);
	});

	// add image element to card content
	cardContentEl.appendChild(imageEl);

	// create the card footer
	const cardFooterEl = document.createElement("div");
	cardFooterEl.classList = "card-footer";
	cardFooterEl.innerHTML = `
        <button class="button primary icon-likes">${likesText}</button>
        <a
            href="${props.source_link}"
            target="_blank"
            class="link"
            >View on ${platformText}</a
        >
    `;

	// create the card element
	const cardEl = document.createElement("div");
	cardEl.classList = "card";
	cardEl.appendChild(cardHeaderEl);
	cardEl.appendChild(cardContentEl);
	cardEl.appendChild(cardFooterEl);

	return cardEl;
};

const fetchDataAndRender = async () => {
	const data = await fetchData(ITEMS_TO_LOAD);
	for (const obj of data) {
		const cardEl = createCardElement(obj);
		cardsContainerEl.appendChild(cardEl);
	}
};

const fakeLoading = () => {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve();
		}, FAKE_LOADING_TIMEOUT);
	});
};

const clearLoading = () => {
	loadMoreButtonEl.innerHTML = "Load More";
	loadMoreButtonEl.classList.remove("icon-loader");
};

const clearCurrentToastEl = () => {
	try {
		if (currentToastElTimeoutId) clearTimeout(currentToastElTimeoutId);
		if (currentToastEl && document.body.contains(currentToastEl))
			bodyEl.removeChild(currentToastEl);
	} catch (e) {
		console.error("Clear current toast error:", e.message);
	}
};

const showToast = (type, message) => {
	clearCurrentToastEl();

	const toastEl = document.createElement("div");
	toastEl.innerHTML = message;
	toastEl.classList = `toast ${type}`;
	bodyEl.appendChild(toastEl);
	currentToastEl = toastEl;

	// animate toast before removing
	setTimeout(() => {
		toastEl.classList.add("animate-out");
	}, TOAST_TIMEOUT - 300);

	// remove toast element after TOAST_TIMEOUT seconds
	currentToastElTimeoutId = setTimeout(() => {
		clearCurrentToastEl();
	}, TOAST_TIMEOUT);
};

const loadMore = async () => {
	try {
		loadMoreButtonEl.innerHTML = "Loading items...";
		loadMoreButtonEl.classList.add("icon-loader");
		await fakeLoading();
		await fetchDataAndRender();
		showToast("info", `Loaded ${ITEMS_TO_LOAD} more items`);

		if (loadMoreIndex > totalItemsCount - 1) {
			loadMoreButtonEl.style.display = "none";
			loadMoreButtonEl.disabled = true;
		}
	} catch (e) {
		console.error(e.message);
		showToast("error", e.message);
		loadMoreButtonEl.disabled = true;
		loadMoreButtonEl.style.display = "none";
	}

	clearLoading();
};

const toggleDarkMode = () => {
	bodyEl.classList.toggle("dark-mode", !isDarkMode);
	isDarkMode = !isDarkMode;
};

const init = () => {
	fetchDataAndRender();
};

init();

loadMoreButtonEl.addEventListener("click", loadMore);
darkModeToggleEl.addEventListener("click", toggleDarkMode);
