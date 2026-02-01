const http = require("http");

function testRegister() {
  const email = `user${Math.floor(Math.random() * 100000)}@test.com`;
  const body = JSON.stringify({
    email,
    password: "password123",
    name: "Test User"
  });

  const options = {
    hostname: "localhost",
    port: 5000,
    path: "/api/auth/register",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body)
    }
  };

  const req = http.request(options, (res) => {
    let data = "";
    res.on("data", (chunk) => {
      data += chunk;
    });
    res.on("end", () => {
      console.log("Register Response Status:", res.statusCode);
      console.log("Register Response Body:");
      console.log(JSON.parse(data));
      console.log("\n");
      testLogin(email);
    });
  });

  req.on("error", (e) => {
    console.error("Register Error:", e.message);
  });

  req.write(body);
  req.end();
}

function testLogin(email) {
  const body = JSON.stringify({
    email,
    password: "password123"
  });

  const options = {
    hostname: "localhost",
    port: 5000,
    path: "/api/auth/login",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body)
    }
  };

  const req = http.request(options, (res) => {
    let data = "";
    res.on("data", (chunk) => {
      data += chunk;
    });
    res.on("end", () => {
      console.log("Login Response Status:", res.statusCode);
      console.log("Login Response Body:");
      console.log(JSON.parse(data));
      process.exit(0);
    });
  });

  req.on("error", (e) => {
    console.error("Login Error:", e.message);
    process.exit(1);
  });

  req.write(body);
  req.end();
}

// Test invalid login first
function testInvalidLogin() {
  const body = JSON.stringify({
    email: "invalid@test.com",
    password: "wrongpassword"
  });

  const options = {
    hostname: "localhost",
    port: 5000,
    path: "/api/auth/login",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body)
    }
  };

  const req = http.request(options, (res) => {
    let data = "";
    res.on("data", (chunk) => {
      data += chunk;
    });
    res.on("end", () => {
      console.log("Invalid Login Response Status:", res.statusCode);
      console.log("Invalid Login Response Body:");
      console.log(JSON.parse(data));
      console.log("\n");
      testRegister();
    });
  });

  req.on("error", (e) => {
    console.error("Invalid Login Error:", e.message);
    process.exit(1);
  });

  req.write(body);
  req.end();
}

console.log("Testing Authentication Endpoints...\n");
testInvalidLogin();
