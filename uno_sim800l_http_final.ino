
#include <SoftwareSerial.h>
#include <ArduinoJson.h>

// --- Pin Definitions ---
SoftwareSerial sim(10, 11);  // SIM800L TX -> 10, RX <- 11

// --- Configuration ---
const char* APN = "airtelgprs.com"; 

// --- IMPORTANT: UPDATE THIS URL ---
// 1. Run your server: npm run dev
// 2. In a NEW terminal, run: ngrok http 9002
// 3. Copy the "Forwarding" URL from ngrok (it looks like https://....ngrok-free.app)
// 4. Paste it below, keeping the "/api/getMission?droneId=SB-001" part.
//    It MUST be http, not https. So change "https" to "http".
const char* SERVER_URL = "http://<your-ngrok-url-here>.ngrok-free.app/api/getMission?droneId=SB-001";

// --- Helper Functions ---
bool sendATCommand(const char* command, const char* expected_response, unsigned long timeout) {
  unsigned long startTime = millis();
  sim.println(command);
  Serial.print("Sent: ");
  Serial.println(command);

  String response = "";
  while (millis() - startTime < timeout) {
    if (sim.available()) {
      char c = sim.read();
      response += c;
      Serial.write(c); // Echo for debugging
    }
    if (response.indexOf(expected_response) != -1) {
      return true;
    }
  }
  Serial.println("\n[ERROR] Timeout or incorrect response.");
  return false;
}

String readHttpResponse() {
  String response = "";
  unsigned long startTime = millis();
  bool foundJson = false;

  while (millis() - startTime < 5000) {
    if (sim.available()) {
      char c = sim.read();
      if (c == '{') foundJson = true;
      if (foundJson) response += c;
      if (c == '}' && foundJson) break;
    }
  }
  return response;
}

bool initializeSIM() {
  Serial.println("Initializing SIM800L...");
  sim.begin(9600);
  delay(1000);

  if (!sendATCommand("AT", "OK", 2000)) return false;
  if (!sendATCommand("ATE0", "OK", 2000)) return false;
  if (!sendATCommand("AT+CPIN?", "READY", 5000)) return false;
  if (!sendATCommand("AT+CSQ", "OK", 2000)) return false;

  Serial.println("Connecting to GPRS...");
  if (!sendATCommand("AT+CGATT?", "+CGATT: 1", 5000)) return false;

  String cmd = "AT+CSTT=\"";
  cmd += APN;
  cmd += "\"";
  if (!sendATCommand(cmd.c_str(), "OK", 5000)) return false;

  if (!sendATCommand("AT+CIICR", "OK", 10000)) return false;
  if (!sendATCommand("AT+CIFSR", ".", 5000)) return false;

  Serial.println("SIM Initialized and GPRS Connected.");
  return true;
}

void getCustomerDetails() {
  Serial.println("\nInitializing HTTP...");
  if (!sendATCommand("AT+HTTPINIT", "OK", 5000)) return;
  if (!sendATCommand("AT+HTTPPARA=\"CID\",1", "OK", 5000)) return;

  String url_cmd = "AT+HTTPPARA=\"URL\",\"";
  url_cmd += SERVER_URL;
  url_cmd += "\"";

  Serial.println("Requesting: " + String(SERVER_URL));
  if (!sendATCommand(url_cmd.c_str(), "OK", 5000)) {
    sendATCommand("AT+HTTPTERM", "OK", 2000);
    return;
  }

  if (!sendATCommand("AT+HTTPACTION=0", "+HTTPACTION: 0,200", 20000)) {
    Serial.println("[ERROR] HTTP GET failed.");
    sendATCommand("AT+HTTPTERM", "OK", 2000);
    return;
  }

  Serial.println("Reading HTTP Response...");
  sendATCommand("AT+HTTPREAD", "OK", 10000);
  String jsonResponse = readHttpResponse();
  Serial.println("Extracted JSON: " + jsonResponse);

  sendATCommand("AT+HTTPTERM", "OK", 2000);

  if (jsonResponse.length() > 0) {
    DynamicJsonDocument doc(512);  // Increased size for safety
    DeserializationError error = deserializeJson(doc, jsonResponse);

    if (error) {
      Serial.print("[ERROR] JSON Parse Failed: ");
      Serial.println(error.f_str());
      return;
    }

    if (doc.containsKey("latitude") && doc.containsKey("longitude")) {
      float latitude = doc["latitude"];
      float longitude = doc["longitude"];
      const char* orderId = doc["orderId"];

      Serial.println("\n--- Mission Details ---");
      Serial.print("Order ID : ");
      Serial.println(orderId);
      Serial.print("Latitude : ");
      Serial.println(latitude, 6);
      Serial.print("Longitude: ");
      Serial.println(longitude, 6);
      Serial.println("------------------------");
    } else {
      Serial.println("[ERROR] Valid JSON but no lat/lon.");
    }
  } else {
    Serial.println("[ERROR] No JSON object found.");
  }
}

// --- Arduino Standard Functions ---
void setup() {
  Serial.begin(9600);
  while (!Serial);

  if (initializeSIM()) {
    Serial.println("\nSystem Ready.");
    Serial.println("Type 'g' to GET customer location.");
  } else {
    Serial.println("\n[FATAL] SIM Initialization failed.");
    while (true); // Halt
  }
}

void loop() {
  if (Serial.available()) {
    char cmd = Serial.read();
    if (cmd == 'g') {
      getCustomerDetails();
    }
  }

  while (sim.available()) {
    Serial.write(sim.read());  // Pass-through for debug
  }
}
