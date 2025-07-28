#include <SoftwareSerial.h>
#include <ArduinoJson.h>

// --- Pin Definitions ---
// Connect SIM800L TX to Arduino pin 10
// Connect SIM800L RX to Arduino pin 11
SoftwareSerial sim(10, 11);

// --- Configuration ---
// IMPORTANT: Replace with your mobile carrier's APN
const char* APN = "airtelgprs.com"; 
// IMPORTANT: This MUST be a PUBLIC IP or a service like ngrok.
// A local IP like 192.168.x.x will NOT work.
const char* SERVER_URL = "http://YOUR_PUBLIC_IP_OR_NGROK_URL/api/getMission?droneId=SB-001";

// --- Helper Functions ---

/**
 * @brief Sends a command to the SIM800L and waits for a specific response.
 * @param command The AT command to send.
 * @param expected_response The response to wait for (e.g., "OK").
 * @param timeout The time to wait for the response in milliseconds.
 * @return True if the expected response was received, false otherwise.
 */
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
      Serial.write(c); // Echo response to Serial Monitor for debugging
    }
    if (response.indexOf(expected_response) != -1) {
      return true;
    }
  }
  Serial.println("\n[ERROR] Timeout or incorrect response.");
  return false;
}

/**
 * @brief Reads the full HTTP response from the SIM800L buffer.
 * @return The body of the HTTP response.
 */
String readHttpResponse() {
    String response = "";
    unsigned long startTime = millis();
    bool foundJson = false;

    // The JSON data is usually between the first '{' and last '}'
    while (millis() - startTime < 5000) { // 5-second timeout
        if (sim.available()) {
            char c = sim.read();
            if (c == '{') {
                foundJson = true;
            }
            if (foundJson) {
                response += c;
            }
            if (c == '}' && foundJson) {
                break; // Stop after capturing the full JSON object
            }
        }
    }
    return response;
}


/**
 * @brief Initializes the SIM800L module and connects to GPRS.
 * @return True on success, false on failure.
 */
bool initializeSIM() {
  Serial.println("Initializing SIM800L...");
  sim.begin(9600);
  delay(1000);

  if (!sendATCommand("AT", "OK", 2000)) return false;
  if (!sendATCommand("ATE0", "OK", 2000)) return false; // Disable echo
  if (!sendATCommand("AT+CPIN?", "READY", 5000)) return false; // Check SIM status
  if (!sendATCommand("AT+CSQ", "OK", 2000)) return false; // Check signal quality
  
  Serial.println("Connecting to GPRS...");
  if (!sendATCommand("AT+CGATT?", "+CGATT: 1", 5000)) {
    Serial.println("[ERROR] Failed to attach to GPRS.");
    return false;
  }
  
  String cmd = "AT+CSTT=\"";
  cmd += APN;
  cmd += "\"";
  if (!sendATCommand(cmd.c_str(), "OK", 5000)) return false;

  if (!sendATCommand("AT+CIICR", "OK", 10000)) {
    Serial.println("[ERROR] Failed to bring up wireless connection.");
    return false;
  }
  
  if (!sendATCommand("AT+CIFSR", ".", 5000)) { // Check for local IP
    Serial.println("[ERROR] Failed to get local IP address.");
    return false;
  }
  
  Serial.println("SIM Initialized and GPRS Connected.");
  return true;
}

/**
 * @brief Makes an HTTP GET request to the server and parses the response.
 */
void getCustomerDetails() {
  Serial.println("\nInitializing HTTP for GET request...");
  if (!sendATCommand("AT+HTTPINIT", "OK", 5000)) return;
  if (!sendATCommand("AT+HTTPPARA=\"CID\",1", "OK", 5000)) return;

  String url_cmd = "AT+HTTPPARA=\"URL\",\"";
  url_cmd += SERVER_URL;
  url_cmd += "\"";
  
  Serial.println("Requesting URL: " + String(SERVER_URL));
  if (!sendATCommand(url_cmd.c_str(), "OK", 5000)) {
      sendATCommand("AT+HTTPTERM", "OK", 2000);
      return;
  }

  Serial.println("Performing HTTP GET Action...");
  if (!sendATCommand("AT+HTTPACTION=0", "+HTTPACTION: 0,200", 20000)) {
    Serial.println("[ERROR] HTTP GET request failed. Check server URL and network.");
    sendATCommand("AT+HTTPTERM", "OK", 2000);
    return;
  }
  
  Serial.println("Reading HTTP Response...");
  sendATCommand("AT+HTTPREAD", "OK", 10000);

  // The actual data is printed between the AT+HTTPREAD and the final OK.
  // We need to read it from the serial buffer.
  String jsonResponse = readHttpResponse();
  Serial.println("Extracted JSON: " + jsonResponse);

  // Terminate HTTP session
  sendATCommand("AT+HTTPTERM", "OK", 2000);

  // Parse the JSON response
  if (jsonResponse.length() > 0) {
    DynamicJsonDocument doc(256); // Allocate memory for the JSON document
    DeserializationError error = deserializeJson(doc, jsonResponse);

    if (error) {
      Serial.print("[ERROR] deserializeJson() failed: ");
      Serial.println(error.f_str());
      return;
    }

    if (doc.containsKey("latitude") && doc.containsKey("longitude")) {
      float latitude = doc["latitude"];
      float longitude = doc["longitude"];
      const char* orderId = doc["orderId"];

      Serial.println("--- Mission Details ---");
      Serial.print("Order ID: ");
      Serial.println(orderId);
      Serial.print("Latitude: ");
      Serial.println(latitude, 6); // Print with 6 decimal places
      Serial.print("Longitude: ");
      Serial.println(longitude, 6);
      Serial.println("-----------------------");
    } else {
      Serial.println("No mission found. JSON received, but without lat/lon.");
    }
  } else {
    Serial.println("No JSON object found in response. Is there a mission for this drone?");
  }
}

void setup() {
  Serial.begin(9600);
  while (!Serial); // Wait for Serial Monitor to connect

  if (initializeSIM()) {
    Serial.println("\nSystem Ready.");
    Serial.println("Type 'g' to GET customer details from server.");
  } else {
    Serial.println("\n[FATAL] System failed to initialize. Please check hardware and connections.");
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

  // Forward any unsolicited messages from SIM800L to Serial Monitor
  while (sim.available()) {
    Serial.write(sim.read());
  }
}
