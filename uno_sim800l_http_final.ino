#include <SoftwareSerial.h>
#include <ArduinoJson.h>

// --- Pin Definitions ---
SoftwareSerial sim(10, 11);  // SIM800L TX -> 10, RX <- 11

// --- Configuration ---
// IMPORTANT: You must get this URL from the 'ngrok' tool running on your computer.
// It will look something like: https://xxxxxxxxxxxx.ngrok-free.app
const char* NGROK_URL = "https://your-ngrok-forwarding-url.ngrok-free.app"; // <-- Replace this with your actual ngrok URL

// --- Helper Functions ---
// Sends an AT command and waits for a specific response.
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
      Serial.write(c); // Echo every character from SIM to Serial Monitor for debugging
    }
    if (response.indexOf(expected_response) != -1) {
      return true;
    }
  }
  Serial.println("\n[ERROR] Timeout or incorrect response.");
  return false;
}

// Reads the body of an HTTP response, looking for a JSON object.
String readHttpResponse() {
  String response = "";
  unsigned long startTime = millis();
  bool foundJson = false;

  // This loop will listen for a response and try to find the start of a JSON object '{'
  while (millis() - startTime < 10000) { // Increased timeout to 10s
    if (sim.available()) {
      char c = sim.read();
      Serial.write(c); // Echo for debugging
      if (c == '{') {
        foundJson = true;
      }
      if (foundJson) {
        response += c;
      }
      // If we've found the end of the JSON object, we can stop.
      if (c == '}' && foundJson) {
        break;
      }
    }
  }
  return response;
}


// Initializes the SIM module and connects to GPRS.
bool initializeSIM() {
  Serial.println("Initializing SIM800L...");
  sim.begin(9600);
  delay(1000);

  if (!sendATCommand("AT", "OK", 2000)) return false;
  if (!sendATCommand("ATE0", "OK", 2000)) return false; // Turn off echo
  if (!sendATCommand("AT+CPIN?", "READY", 5000)) return false;
  if (!sendATCommand("AT+CSQ", "OK", 2000)) return false; // Check signal quality

  Serial.println("Connecting to GPRS...");
  if (!sendATCommand("AT+CGATT?", "+CGATT: 1", 5000)) return false;
  
  // Added a delay here to give the module time to settle after GPRS attachment
  delay(2000); 

  String cmd = "AT+CSTT=\"";
  cmd += APN;
  cmd += "\"";
  if (!sendATCommand(cmd.c_str(), "OK", 5000)) return false;

  if (!sendATCommand("AT+CIICR", "OK", 10000)) return false; // Bring up wireless connection
  if (!sendATCommand("AT+CIFSR", ".", 5000)) return false;   // Get local IP address

  Serial.println("SIM Initialized and GPRS Connected.");
  return true;
}


// Performs the HTTP GET request and parses the response.
void getCustomerDetails() {
  // Construct the full URL for the API request
  String full_url = String(NGROK_URL) + "/api/getMission?droneId=SB-001";

  Serial.println("\nInitializing HTTP...");
  if (!sendATCommand("AT+HTTPINIT", "OK", 5000)) return;
  if (!sendATCommand("AT+HTTPPARA=\"CID\",1", "OK", 5000)) return;

  // Set the URL for the HTTP request
  String url_cmd = "AT+HTTPPARA=\"URL\",\"";
  url_cmd += full_url;
  url_cmd += "\"";

  Serial.println("Requesting: " + full_url);
  if (!sendATCommand(url_cmd.c_str(), "OK", 5000)) {
    sendATCommand("AT+HTTPTERM", "OK", 2000);
    return;
  }
  
  // Set SSL parameter for HTTPS URLs
  if (String(NGROK_URL).startsWith("https")) {
    if(!sendATCommand("AT+HTTPSSL=1", "OK", 5000)) {
        sendATCommand("AT+HTTPTERM", "OK", 2000);
        return;
    }
  }

  // Perform the GET action
  if (!sendATCommand("AT+HTTPACTION=0", "+HTTPACTION: 0,200", 20000)) {
    Serial.println("[ERROR] HTTP GET failed. Check server or ngrok connection.");
    sendATCommand("AT+HTTPTERM", "OK", 2000);
    return;
  }

  Serial.println("Reading HTTP Response...");
  sendATCommand("AT+HTTPREAD", "OK", 10000);
  String jsonResponse = readHttpResponse();
  Serial.println("Extracted JSON: " + jsonResponse);

  sendATCommand("AT+HTTPTERM", "OK", 2000); // Terminate HTTP session

  // --- JSON Parsing ---
  if (jsonResponse.length() > 0) {
    DynamicJsonDocument doc(512);
    DeserializationError error = deserializeJson(doc, jsonResponse);

    if (error) {
      Serial.print("[ERROR] JSON Parsing Failed: ");
      Serial.println(error.f_str());
      return;
    }

    // Check if the expected keys exist in the JSON
    if (doc.containsKey("latitude") && doc.containsKey("longitude")) {
      float latitude = doc["latitude"];
      float longitude = doc["longitude"];
      const char* orderId = doc["orderId"];

      Serial.println("\n--- Mission Details Received ---");
      Serial.print("Order ID : ");
      Serial.println(orderId);
      Serial.print("Latitude : ");
      Serial.println(latitude, 6); // Print with 6 decimal places
      Serial.print("Longitude: ");
      Serial.println(longitude, 6); // Print with 6 decimal places
      Serial.println("---------------------------------");
    } else if (doc.size() == 0) {
      Serial.println("[INFO] Server responded with an empty object. No mission found for this drone.");
    }
    else {
      Serial.println("[ERROR] Valid JSON received, but it does not contain 'latitude' and 'longitude'.");
    }
  } else {
    Serial.println("[ERROR] No JSON object found in the HTTP response.");
  }
}

// --- Arduino Standard Functions ---
void setup() {
  Serial.begin(9600);
  while (!Serial); // Wait for Serial monitor to open

  if (initializeSIM()) {
    Serial.println("\nSystem Ready.");
    Serial.println("Type 'g' to GET customer location.");
  } else {
    Serial.println("\n[FATAL] SIM Initialization failed. Please check power supply and connections.");
    while (true); // Halt execution
  }
}

void loop() {
  if (Serial.available()) {
    char cmd = Serial.read();
    if (cmd == 'g') {
      getCustomerDetails();
    }
  }

  // This is a pass-through for debugging. Any unexpected messages from the SIM will be printed.
  while (sim.available()) {
    Serial.write(sim.read());
  }
}
