// ===== IMAGE DATA =====
// Pointing to the local files in the 'images' folder
var viewerImages = [
  {
    html: '<img src="images/house.jpg" class="panoramic-img" />',
    label: 'Modern House'
  },
  {
    html: '<img src="images/land.jpg" class="panoramic-img" />',
    label: 'Beautiful Landscape'
  }
];

var currentIndex = 0;
var scrollTimeout;

// ===== OPEN VIEWER =====
function openViewer(index) {
  currentIndex = index;

  var scrollArea = document.getElementById('scrollArea');
  scrollArea.innerHTML = viewerImages[index].html;

  document.getElementById('imageCounter').textContent =
    viewerImages[index].label + ' (' + (index + 1) + ' of ' + viewerImages.length + ')';

  document.getElementById('imageViewer').classList.add('active');
  document.body.classList.add('viewer-open');

  var img = scrollArea.querySelector('img');

  // Helper function: Centers the scroll perfectly
  function centerImage() {
    var maxScroll = scrollArea.scrollWidth - scrollArea.clientWidth;
    if (maxScroll > 0) {
      scrollArea.scrollLeft = maxScroll / 2;
    }
    updateProgressBar();
  }

  // Wait for image to load to know its exact width for centering
  if (img.complete) {
    centerImage();
  } else {
    img.onload = centerImage;
  }

  tryLockLandscape();
  showScrollIndicator();

  // Push state so back button works
  history.pushState({ viewerOpen: true }, '');
}

// ===== CLOSE VIEWER =====
function closeViewer() {
  document.getElementById('imageViewer').classList.remove('active');
  document.body.classList.remove('viewer-open');
  tryUnlockOrientation();
}

// ===== ORIENTATION LOCK =====
function tryLockLandscape() {
  if (screen.orientation && screen.orientation.lock) {
    screen.orientation.lock('landscape').catch(function () { });
  }
}

function tryUnlockOrientation() {
  if (screen.orientation && screen.orientation.unlock) {
    screen.orientation.unlock();
  }
}

// ===== PROGRESS BAR =====
function updateProgressBar() {
  var el = document.getElementById('scrollArea');
  var bar = document.getElementById('progressBar');
  var scrollWidth = el.scrollWidth - el.clientWidth;

  if (scrollWidth <= 0) {
    bar.style.width = '100%';
    return;
  }
  bar.style.width = (el.scrollLeft / scrollWidth) * 100 + '%';
}

// ===== SCROLL INDICATOR =====
function showScrollIndicator() {
  var indicator = document.getElementById('scrollIndicator');
  indicator.classList.remove('hidden');

  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(function () {
    indicator.classList.add('hidden');
  }, 3500);
}

// ===== SCROLL LISTENER =====
var scrollArea = document.getElementById('scrollArea');
scrollArea.addEventListener('scroll', function () {
  updateProgressBar();
});

// ===== MOBILE TOUCH SCROLL MAPPING =====
// Fixes the issue where rotated containers block normal touch scrolling
var isDragging = false;
var startY, startScrollLeft;

scrollArea.addEventListener('touchstart', function(e) {
  isDragging = true;
  startY = e.touches[0].clientY; 
  startScrollLeft = scrollArea.scrollLeft;
}, { passive: true });

scrollArea.addEventListener('touchmove', function(e) {
  if (!isDragging) return;
  var isLandscape = window.matchMedia("(orientation: landscape)").matches;
  
  // If user holds phone normally in portrait, but UI is rotated landscape 90deg
  if (!isLandscape) {
    var currentY = e.touches[0].clientY;
    var dy = currentY - startY; 
    
    // Physical Up/Down swipe translates directly to Visual Left/Right scroll
    var newScroll = startScrollLeft - dy;

    // Apply scroll logic smoothly and prevent default bouncing
    if (e.cancelable) e.preventDefault();
    scrollArea.scrollLeft = newScroll;
  }
}, { passive: false });

scrollArea.addEventListener('touchend', function() { isDragging = false; });
scrollArea.addEventListener('touchcancel', function() { isDragging = false; });


// ===== BACK BUTTON =====
window.addEventListener('popstate', function (e) {
  if (document.getElementById('imageViewer').classList.contains('active')) {
    closeViewer();
    history.pushState(null, '');
  }
});

// ===== SWIPE TO CLOSE VIEWER =====
var viewerTouchStartX = 0;
var viewerTouchStartY = 0;

document.getElementById('imageViewer').addEventListener('touchstart', function (e) {
  viewerTouchStartX = e.changedTouches[0].screenX;
  viewerTouchStartY = e.changedTouches[0].screenY;
}, { passive: true });

document.getElementById('imageViewer').addEventListener('touchend', function (e) {
  var isLandscape = window.matchMedia("(orientation: landscape)").matches;
  var currentX = e.changedTouches[0].screenX;
  var currentY = e.changedTouches[0].screenY;
  
  if (!isLandscape) {
    // In Portrait (UI rotated), a visual UP swipe is a physical Left-to-Right swipe (X)
    var diffX = currentX - viewerTouchStartX;
    if (diffX > 80) {
      closeViewer();
    }
  } else {
    // In native Landscape, a visual UP swipe is a physical Bottom-to-Top swipe (Y)
    var diffY = viewerTouchStartY - currentY;
    if (diffY > 80) {
      closeViewer();
    }
  }
}, { passive: true });
