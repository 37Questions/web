const API_ENDPOINT = "http://192.168.0.102:3000";

async function getUser(attempt = 0) {
  const USER_KEY = "questions-user";

  return new Promise((resolve) => {
    if (attempt > 3) {
      console.error("User setup failed too many times, giving up.");
      return resolve(false);
    }

    const savedUser = localStorage.getItem(USER_KEY);
    if (savedUser) {
      const user = JSON.parse(savedUser);
      const req = `/validate-token?id=${user.id}&token=${user.token}`;
      fetch(API_ENDPOINT + req, {method: "GET"}).then((res) => {
        res.json().then((res) => {
          if (res.valid) {
            return resolve(res.user);
          }
          console.warn("Cached user was invalid, attempting to create a new account");
          localStorage.removeItem(USER_KEY);
          return getUser(attempt++);
        });
      });
    } else {
      fetch(API_ENDPOINT + "/user", {method: "POST"}).then((res) => {
        res.json().then((user) => {
          localStorage.setItem(USER_KEY, JSON.stringify(user));
          resolve(user);
        });
      });
    }
  });
}

function generateHue() {
  return Math.floor(Math.random() * 360);
}

async function getIcons() {
  return fetch(API_ENDPOINT + "/icons", {method: "GET"}).then((res) => {
    return res.json().then((res) => {
      const icons = [];
      res.icons.forEach((icon) => {
        const hue = generateHue();
        icons.push({
          icon: icon,
          background: `hsl(${hue}, 70%, 80%)`,
          color: `hsl(${generateHue()}, 60%, 30%)`,
        });
      });
      return icons;
    });
  });
}

export {API_ENDPOINT, getUser, getIcons};