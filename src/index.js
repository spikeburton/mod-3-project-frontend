const API = `http://localhost:3000/api/v1`;

let USER_NAME, USER_ID, GIF_ID;

document.addEventListener("DOMContentLoaded", () => {
  userSignIn()
  .then(renderGifs);

  const sortDropdown = document.getElementById('sort-dropdown')
  sortDropdown.addEventListener('change', sortGifs)

  const list = document.getElementById("gif-list");
  list.addEventListener("click", handleThumbnailClick);

  const form = document.getElementById("new-gif-form");
  form.addEventListener("submit", handleGifSubmission);
});

function userSignIn() {
  const name = prompt("Please Sign In:");

  return createUser({ name })
  .then(json => {
    if (json.errors) {
      userSignIn();
    } else {
      USER_NAME = json.name;
      USER_ID = json.id;
    }
  });
}

function createUser(data) {
  return fetch(`${API}/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  })
  .then(response => response.json());
}

function renderGifs() {
  document.getElementById("gif-list").innerHTML = "";

  return fetch(`${API}/gifs`)
    .then(res => res.json())
    .then(data => data.forEach(renderGifThumbnail));
}

function renderGifThumbnail(data) {
  const ul = document.getElementById("gif-list");
  const li = document.createElement("li");

  const img = document.createElement("img");
  img.src = data.url;
  img.className = "gif-thumbnail";
  img.dataset.id = data.id;
  li.append(img);

  const avgRating = document.createElement("p");
  avgRating.id = "gif-thumbnail-rating";
  avgRating.textContent = data.avg_rating;
  if (data.reviews.length > 0) {
    li.append(avgRating);
  }

  ul.append(li);
}

function handleThumbnailClick(e) {
  if (e.target.tagName === "IMG") {
    fetch(`${API}/gifs/${e.target.dataset.id}`)
      .then(res => res.json())
      .then(renderDetails)
      .then(renderAllReviews)
      // .then(renderReviewForm);
  }
}

function renderDetails(data) {
  GIF_ID = data.id;

  const gifDetails = document.getElementById("gif-details");
  gifDetails.innerHTML = "";

  const title = document.createElement("h3");
  title.textContent = data.title;
  gifDetails.append(title);

  const avgRating = document.createElement("h3");
  avgRating.textContent = `Average Rating: ${data.avg_rating}`;
  if (data.reviews.length > 0) {
    gifDetails.append(avgRating);
  }

  const gif = document.createElement("img");
  gif.src = data.url;
  gif.className = "gif-detail";
  gifDetails.append(gif);

  // const reviewButton = document.createElement('button')
  // reviewButton.innerText = "Add Review"
  // reviewButton.addEventListener('click', handleReviewButtonClick)
  // gifDetails.append(reviewButton)
  // renderReviewForm();

  return data;
}

function renderReviewForm() {
  const reviewList = document.getElementById("reviews");

  const reviewForm = document.createElement("form");
  reviewForm.id = "review-form";
  reviewForm.dataset.gifId = GIF_ID;
  reviewForm.dataset.userId = USER_ID;

  const ratingField = document.createElement("select");
  ratingField.name = "rating";

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.selected = true;
  defaultOption.disabled = true;
  defaultOption.hidden = true;
  defaultOption.textContent = "Select a Rating";
  ratingField.append(defaultOption);

  for (i = 0; i <= 5; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = i;
    ratingField.append(option);
  }

  reviewForm.append(ratingField);

  const contentField = document.createElement("textarea");
  contentField.name = "content";
  contentField.placeholder = "Type your review here!";
  reviewForm.append(contentField);

  const submitButton = document.createElement("input");
  submitButton.type = "submit";
  reviewForm.append(submitButton);
  reviewForm.addEventListener("submit", handleReviewSubmission);

  reviewList.append(reviewForm);
}

function renderAllReviews(data) {
  const reviews = document.getElementById("reviews");
  reviews.innerHTML = "";

  renderReviewForm();
  data.reviews.forEach(renderReview);

}

function renderReview(data) {
  const reviews = document.getElementById("reviews");
  const content = document.createElement("div");
  content.className = "review-card"

  const author = document.createElement("p");
  author.innerHTML = `<strong>${data.user_name.toLowerCase()}</strong> says:`;
  content.append(author);

  const reviewContent = document.createElement("p");
  reviewContent.textContent = data.content;
  content.append(reviewContent);

  const rating = document.createElement("p");
  rating.innerHTML = `<strong>${data.rating}</strong> stars`;
  content.append(rating);

  if (data.user_id === USER_ID) {
    // console.log(`${USER_NAME} created this review`)
    // console.log(data)
    const deleteButton = document.createElement('button');
    deleteButton.dataset.id = data.id;
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener('click', handleDeleteReview);

    content.append(deleteButton);

    const editButton = document.createElement('button');
    editButton.dataset.id = data.id;
    editButton.textContent = "Edit";
    editButton.addEventListener('click', handleEditReview)

    content.append(editButton);
  }

  reviews.append(content);
}

function handleGifSubmission(e) {
  e.preventDefault();
  const title = e.target.elements["title"].value;
  const url = e.target.elements["url"].value;
  const postBody = { title, url };
  fetch(`${API}/gifs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(postBody)
  })
    .then(res => res.json())
    .then(data => renderGifThumbnail(data));
}

function handleReviewSubmission(e) {
  e.preventDefault();
  const rating = e.target.elements["rating"].value;
  const content = e.target.elements["content"].value;
  const gif_id = e.target.dataset.gifId;
  const user_id = e.target.dataset.userId;
  const postBody = { user_id, rating, content, gif_id };
  fetch(`${API}/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(postBody)
  })
    .then(res => res.json())
    .then(data => {
      if (data.errors) {
        console.error(data.errors);
      } else {
        data.user_name = USER_NAME;
        renderReview(data);
      }
    });

  e.target.reset();
}

function handleDeleteReview(e) {
  // console.log(e.target)
  const id = e.target.dataset.id;
  const review = e.target.parentNode;

  fetch(`${API}/reviews/${id}`, {
    method: "DELETE"
  })
  // .then(console.log)

  review.parentNode.removeChild(review);
}

function handleEditReview(e) {
  const form = document.getElementById('review-form');

  fetch(`${API}/reviews/${e.target.dataset.id}`)
    .then(response => response.json())
    .then(data => {
      form.elements["rating"].value = data.rating;
      form.elements["content"].value = data.content;
      form.dataset.edited = "true";
    })
}

function compareAvgRatings(a, b) {
  if (a.avg_rating < b.avg_rating) {
    return 1;
  } else if (a.avg_rating > b.avg_rating) {
    return -1;
  } else {
    return 0;
  }
}

function compareCreatedAt(a, b) {
  if (a.created_at < b.created_at) {
    return -1
  } else if (a.created_at > b.created_at) {
    return 1
  } else {
    return 0
  }
}

function sortGifs(e) {
  const selection = e.target.value
  const gifs = document.getElementById('gif-list')
  gifs.innerHTML = ''
  switch (selection) {
    case 'best':
      fetch(`${API}/gifs`)
      .then(res => res.json())
      .then(data => data.sort(compareAvgRatings))
      .then(sorted => sorted.forEach(gif => renderGifThumbnail(gif)))
      break;
    case 'worst':
      fetch(`${API}/gifs`)
      .then(res => res.json())
      .then(data => data.sort(compareAvgRatings).reverse())
      .then(sorted => sorted.forEach(gif => renderGifThumbnail(gif)))
      break;
    case 'newest':
      fetch(`${API}/gifs`)
      .then(res => res.json())
      .then(data => data.sort(compareCreatedAt).reverse())
      .then(sorted => sorted.forEach(gif => renderGifThumbnail(gif)))
      break;
    case 'oldest':
      fetch(`${API}/gifs`)
      .then(res => res.json())
      .then(data => data.sort(compareCreatedAt))
      .then(sorted => sorted.forEach(gif => renderGifThumbnail(gif)))
      break;
  }
}
