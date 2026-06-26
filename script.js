const API_KEY = '509a939aa630390f15c41bf8c268e2fc';
const weatherInput = document.querySelector('#city-input');
const searchForm = document.querySelector('#city-form');
const locationBtn = document.querySelector('#location-btn');
const unitBtns = document.querySelectorAll('[data-unit]');
const favoritesList = document.querySelector('#favorites-list');
const historyList = document.querySelector('#history-list');
const feedback = document.querySelector('#feedback');
const loader = document.querySelector('#loader');
const weatherCard = document.querySelector('#weather-card');
const hourlyList = document.querySelector('#hourly-list');
const dailyList = document.querySelector('#daily-list');
const themeToggle = document.querySelector('#theme-toggle');
const favoriteBtn = document.querySelector('#favorite-btn');
const currentCityLabel = document.querySelector('#current-city');
const currentDateLabel = document.querySelector('#current-date');
const currentTempLabel = document.querySelector('#current-temp');
const currentDescription = document.querySelector('#current-description');
const currentFeels = document.querySelector('#feels-like');
const currentHumidity = document.querySelector('#humidity');
const currentWind = document.querySelector('#wind-speed');
const currentVisibility = document.querySelector('#visibility');
const currentSunrise = document.querySelector('#sunrise');
const currentSunset = document.querySelector('#sunset');
const weatherIcon = document.querySelector('#weather-icon');
const weatherDetails = document.querySelector('#weather-details');
const currentTheme = localStorage.getItem('weather-theme') || 'dark';
let currentCity = null;
let currentUnits = localStorage.getItem('weather-units') || 'metric';
let favorites = JSON.parse(localStorage.getItem('weather-favorites') || '[]');
let history = JSON.parse(localStorage.getItem('weather-history') || '[]');

const weatherBackground = {
  Clear: 'bg-clear',
  Clouds: 'bg-clouds',
  Rain: 'bg-rain',
  Drizzle: 'bg-rain',
  Thunderstorm: 'bg-thunder',
  Snow: 'bg-snow',
  Mist: 'bg-mist',
  Smoke: 'bg-mist',
  Haze: 'bg-mist',
  Dust: 'bg-mist',
  Fog: 'bg-mist',
  Sand: 'bg-mist',
  Ash: 'bg-mist',
  Squall: 'bg-thunder',
  Tornado: 'bg-thunder',
};

function displayFeedback(message, duration = 2800) {
  feedback.textContent = message;
  feedback.classList.add('visible');
  clearTimeout(feedback.hideTimeout);
  feedback.hideTimeout = setTimeout(() => feedback.classList.remove('visible'), duration);
}

function setLoading(enabled) {
  loader.classList.toggle('visible', enabled);
}

function formatTemperature(value) {
  return `${Math.round(value)}°${currentUnits === 'metric' ? 'C' : 'F'}`;
}

function formatTime(timestamp, timezone) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timezone,
    hour12: true,
  }).format(new Date(timestamp * 1000));
}

function formatDay(timestamp, timezone) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    timeZone: timezone,
  }).format(new Date(timestamp * 1000));
}

function formatHour(timestamp, timezone) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    timeZone: timezone,
    hour12: true,
  }).format(new Date(timestamp * 1000));
}

function buildIconUrl(icon) {
  return `https://openweathermap.org/img/wn/${icon}@4x.png`;
}

function renderFavorites() {
  favoritesList.innerHTML = ''; 
  if (!favorites.length) {
    favoritesList.innerHTML = '<p class="muted-text">No saved cities yet. Add one while searching.</p>';
    return;
  }
  favorites.forEach(city => {
    const chip = document.createElement('div');
    chip.className = 'city-chip';
    chip.innerHTML = `
      <span>${city}</span>
      <button type="button" aria-label="Select ${city}">▶</button>
    `;
    chip.querySelector('button').addEventListener('click', () => fetchWeatherByCity(city));
    favoritesList.appendChild(chip);
  });
}

function renderHistory() {
  historyList.innerHTML = '';
  if (!history.length) {
    historyList.innerHTML = '<p class="muted-text">Recent searches will appear here.</p>';
    return;
  }
  history.forEach((city, index) => {
    const chip = document.createElement('div');
    chip.className = 'search-chip';
    chip.innerHTML = `
      <span>${city}</span>
      <button type="button" aria-label="Remove ${city}">✕</button>
    `;
    chip.addEventListener('click', (event) => {
      if (event.target.tagName === 'BUTTON') {
        history.splice(index, 1);
        saveHistory();
        renderHistory();
      } else {
        fetchWeatherByCity(city);
      }
    });
    historyList.appendChild(chip);
  });
}

function saveFavorites() {
  localStorage.setItem('weather-favorites', JSON.stringify(favorites));
  renderFavorites();
}

function saveHistory() {
  localStorage.setItem('weather-history', JSON.stringify(history));
  renderHistory();
}

function updateTheme() {
  document.body.classList.toggle('dark', currentTheme === 'dark');
  document.body.classList.toggle('light', currentTheme === 'light');
  themeToggle.textContent = currentTheme === 'dark' ? 'Light mode' : 'Dark mode';
  localStorage.setItem('weather-theme', currentTheme);
}

function updateUnitsButtons() {
  unitBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.unit === currentUnits);
  });
}

function setBackground(condition) {
  const bgClass = weatherBackground[condition] || 'bg-clear';
  weatherCard.className = `card weather-current ${bgClass}`;
}

function updateWeatherDisplay(data, cityName) {
  currentCity = cityName;
  const { current, hourly, daily, timezone } = data;
  currentCityLabel.textContent = cityName;
  currentDateLabel.textContent = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: timezone }).format(new Date(current.dt * 1000));
  currentTempLabel.textContent = formatTemperature(current.temp);
  currentDescription.textContent = `${current.weather[0].description.replace(/\b\w/g, (s) => s.toUpperCase())}`;
  currentFeels.textContent = formatTemperature(current.feels_like);
  currentHumidity.textContent = `${current.humidity}%`;
  currentWind.textContent = `${current.wind_speed} ${currentUnits === 'metric' ? 'm/s' : 'mph'}`;
  currentVisibility.textContent = `${(current.visibility / 1000).toFixed(1)} ${currentUnits === 'metric' ? 'km' : 'mi'}`;
  currentSunrise.textContent = formatTime(current.sunrise, timezone);
  currentSunset.textContent = formatTime(current.sunset, timezone);
  weatherIcon.src = buildIconUrl(current.weather[0].icon);
  weatherIcon.alt = current.weather[0].description;
  setBackground(current.weather[0].main);
  renderHourly(hourly.slice(0, 12), timezone);
  renderDaily(daily.slice(1, 6), timezone);
  favoriteBtn.textContent = favorites.includes(cityName) ? 'Saved' : 'Save city';
}

function renderHourly(hourly, timezone) {
  hourlyList.innerHTML = '';
  hourly.forEach(hour => {
    const card = document.createElement('div');
    card.className = 'hour-card';
    card.innerHTML = `
      <span class="hour-label">${formatHour(hour.dt, timezone)}</span>
      <img src="${buildIconUrl(hour.weather[0].icon)}" alt="${hour.weather[0].description}" />
      <strong>${Math.round(hour.temp)}°</strong>
      <span class="muted-text">${hour.pop * 100}% rain</span>
    `;
    hourlyList.appendChild(card);
  });
}

function renderDaily(daily, timezone) {
  dailyList.innerHTML = '';
  daily.forEach(day => {
    const card = document.createElement('div');
    card.className = 'day-card';
    card.innerHTML = `
      <div>
        <span class="day-label">${formatDay(day.dt, timezone)}</span>
        <strong>${day.weather[0].description.replace(/\b\w/g, (s) => s.toUpperCase())}</strong>
        <span class="muted-text">High ${Math.round(day.temp.max)}° • Low ${Math.round(day.temp.min)}°</span>
      </div>
      <img src="${buildIconUrl(day.weather[0].icon)}" alt="${day.weather[0].description}" />
    `;
    dailyList.appendChild(card);
  });
}

async function fetchWeather(lat, lon, cityName) {
  if (!API_KEY || API_KEY === '509a939aa630390f15c41bf8c268e2fc') {
    displayFeedback('Add your OpenWeatherMap API key in script.js first.');
    return;
  }
  try {
    setLoading(true);
    const response = await fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,alerts&units=${currentUnits}&appid=${API_KEY}`);
    if (!response.ok) throw new Error('Failed to fetch weather details');
    const data = await response.json();
    updateWeatherDisplay(data, cityName);
    addToHistory(cityName);
  } catch (error) {
    displayFeedback('Unable to load weather details. Try again.');
    console.error(error);
  } finally {
    setLoading(false);
  }
}

async function fetchWeatherByCity(city) {
  if (!city) {
    displayFeedback('Please enter a city name.');
    return;
  }
  try {
    setLoading(true);
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=${currentUnits}&appid=${API_KEY}`);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('City not found');
      }
      throw new Error('Search failed');
    }
    const result = await response.json();
    await fetchWeather(result.coord.lat, result.coord.lon, `${result.name}, ${result.sys.country}`);
  } catch (error) {
    displayFeedback(error.message === 'City not found' ? 'City not found. Please try another city.' : 'Search failed. Check the spelling.');
  } finally {
    setLoading(false);
  }
}

function addToHistory(city) {
  const normalized = city.trim();
  if (!normalized) return;
  history = [normalized, ...history.filter(item => item !== normalized)].slice(0, 8);
  saveHistory();
}

function loadLocalSettings() {
  document.body.classList.add(currentTheme);
  updateTheme();
  updateUnitsButtons();
  renderFavorites();
  renderHistory();
}

function saveUnitPreference(unit) {
  currentUnits = unit;
  localStorage.setItem('weather-units', unit);
  updateUnitsButtons();
}

themeToggle.addEventListener('click', () => {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  updateTheme();
});

unitBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.dataset.unit !== currentUnits) {
      saveUnitPreference(btn.dataset.unit);
      if (currentCity) fetchWeatherByCity(currentCity);
    }
  });
});

searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  fetchWeatherByCity(weatherInput.value.trim());
});

locationBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    displayFeedback('Geolocation is not supported by your browser.');
    return;
  }
  setLoading(true);
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=${currentUnits}&appid=${API_KEY}`);
        if (!response.ok) throw new Error();
        const result = await response.json();
        await fetchWeather(latitude, longitude, `${result.name}, ${result.sys.country}`);
      } catch {
        displayFeedback('Unable to get weather for your location.');
      } finally {
        setLoading(false);
      }
    },
    () => {
      displayFeedback('Location access denied or unavailable.');
      setLoading(false);
    },
    { timeout: 10000 }
  );
});

favoriteBtn.addEventListener('click', () => {
  if (!currentCity) return;
  if (favorites.includes(currentCity)) {
    favorites = favorites.filter((city) => city !== currentCity);
    displayFeedback(`${currentCity} removed from favorites.`);
  } else {
    favorites = [currentCity, ...favorites.filter((city) => city !== currentCity)].slice(0, 10);
    displayFeedback(`${currentCity} saved to favorites.`);
  }
  saveFavorites();
});

window.addEventListener('DOMContentLoaded', () => {
  loadLocalSettings();
  if (history.length) {
    fetchWeatherByCity(history[0]);
  } else {
    fetchWeatherByCity('London');
  }
});
