const cities = {
  minsk: { name: "Минск", latitude: 53.90, longitude: 27.57 },
  brest: { name: "Брест", latitude: 52.10, longitude: 23.69 },
  warsaw: { name: "Варшава", latitude: 52.23, longitude: 21.01 },
  tbilisi: { name: "Тбилиси", latitude: 41.72, longitude: 44.79 },
};

const form = document.querySelector("#weather-form");
const citySelect = document.querySelector("#city");
const button = document.querySelector("#load-weather");
const statusMessage = document.querySelector("#status");
const reportCity = document.querySelector("#report-city");
const temperature = document.querySelector("#temperature");
const conditions = document.querySelector("#conditions");
const humidity = document.querySelector("#humidity");
const wind = document.querySelector("#wind");
const localTime = document.querySelector("#local-time");

function buildWeatherUrl(city) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", city.latitude);
  url.searchParams.set("longitude", city.longitude);
  url.searchParams.set("current", "temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("wind_speed_unit", "ms");
  return url;
}

async function getCurrentWeather(city) {
  const url = buildWeatherUrl(city);
  const response = await fetch(url, { method: "GET" });
  if (!response.ok) {
    throw new Error(`Сервис погоды ответил с ошибкой HTTP ${response.status}.`);
  }
  const data = await response.json();
  const current = data?.current;
  if (!current || typeof current.time !== "string" ||
      ![current.temperature_2m, current.relative_humidity_2m, current.wind_speed_10m].every(Number.isFinite)) {
    throw new Error("В ответе API не хватает данных о погоде.");
  }
  return current;
}

function weatherDescription(code) {
  if ([0, 1].includes(code)) return "Ясно";
  if ([2, 3].includes(code)) return "Облачно";
  if ([45, 48].includes(code)) return "Туман";
  if ([51, 53, 55].includes(code)) return "Морось";
  if ([56, 57, 66, 67].includes(code)) return "Переохлаждённые осадки";
  if ([61, 63, 65, 80, 81, 82].includes(code)) return "Дождь";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Снег";
  if ([95, 96, 97, 99].includes(code)) return "Гроза";
  return "Условия не определены";
}

function clearWeather(city) {
  reportCity.textContent = city.name;
  temperature.textContent = "—";
  conditions.textContent = "Нет данных";
  humidity.textContent = "—";
  wind.textContent = "—";
  localTime.textContent = "—";
}

function showWeather(current) {
  temperature.textContent = `${current.temperature_2m.toLocaleString("ru-RU")} °C`;
  conditions.textContent = weatherDescription(current.weather_code);
  humidity.textContent = `${current.relative_humidity_2m} %`;
  wind.textContent = `${current.wind_speed_10m.toLocaleString("ru-RU")} м/с`;
  localTime.textContent = current.time.slice(11, 16);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const city = cities[citySelect.value];
  clearWeather(city);
  statusMessage.dataset.error = "false";
  statusMessage.textContent = "Загружаем погоду…";
  button.disabled = true;
  citySelect.disabled = true;

  try {
    const current = await getCurrentWeather(city);
    showWeather(current);
    statusMessage.textContent = `Сводка загружена: ${city.name}.`;
  } catch (error) {
    statusMessage.dataset.error = "true";
    if (error instanceof TypeError) {
      statusMessage.textContent = "Нет связи с API. Проверьте интернет и повторите запрос.";
    } else if (error instanceof SyntaxError) {
      statusMessage.textContent = "Не удалось прочитать ответ API как JSON.";
    } else {
      statusMessage.textContent = error.message;
    }
    console.error(error);
  } finally {
    button.disabled = false;
    citySelect.disabled = false;
  }
});
