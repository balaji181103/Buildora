#include <SoftwareSerial.h>
#include <ArduinoJson.h>

// --- Pin Definitions ---
// Connect the SIM800L TX pin to Arduino pin 10
// Connect the SIM800L RX pin to Arduino pin 11
SoftwareSerial sim(10, 11);

// --- Configuration ---
// IMPORTANT: You must update this URL every time you restart ngrok!
// 1. Run your server: `npm run dev`
// 2. Expose it with ngrok: `ngrok http 9002`
// 3. Copy the Forwarding URL (e.g., https://1a2b-3c4d.ngrok-free.app) and paste it below.
const char* SERVER_URL = "https://your-ngrok-url.ngrok-free.app/api/getMission?droneId=SB-001";

// --- Helper Functions ---
/**
 * @brief Sends an AT command to the SIM800L module and waits for an expected response.
 * @param command The AT command to send.
 * @param expected_response The string to look for in the module's response.
 * @param timeout The maximum time to wait for a response in milliseconds.
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
    }
  }
  
  Serial.println("Rcvd: " + response);
  if (response.indexOf(expected_response) != -1) {
    return true;
  }
  
  Serial.println("[ERROR] Timeout or incorrect response.");
  return false;
}

/**
 * @brief Reads the body of an HTTP response from the SIM800L.
 * @return A String containing the JSON payload, or an empty string if not found.
 */
String readHttpResponse() {
  String response = "";
  unsigned long startTime = millis();
  bool jsonStarted = false;

  // Wait for the start of the JSON object '{'
  while (millis() - startTime < 10000) { 
    if (sim.available()) {
      char c = sim.read();
      if (c == '{') {
        jsonStarted = true;
        response += c;
        break; // Start capturing the rest of the JSON
      }
    }
  }

  if (jsonStarted) {
    while (millis() - startTime < 15000) { // Continue reading the rest of the object
      if (sim.available()) {
        char c = sim.read();
        response += c;
        if (c == '}') {
          break; // JSON object finished
        }
      }
    }
  }
  return response;
}

/**
 * @brief Initializes the SIM800L module and connects to the GPRS network.
 * @return True on success, false on failure.
 */
bool initializeSIM() {
  Serial.println("--- Initializing SIM800L ---");
  sim.begin(9600);
  delay(2000);

  if (!sendATCommand("AT", "OK", 2000)) return false;
  if (!sendATCommand("ATE0", "OK", 2000)) return false; // Disable command echo

  Serial.println("Checking network registration...");
  if (!sendATCommand("AT+CREG?", "+CREG: 0,1", 10000)) { // 0,1 means registered, home network
    Serial.println("[ERROR] Not registered on network.");
    return false;
  }

  Serial.println("Opening GPRS bearer...");
  if (!sendATCommand("AT+SAPBR=3,1,\"CONTYPE\",\"GPRS\"", "OK", 5000)) return false;
  
  // Set the APN for your carrier
  if (!sendATCommand("AT+SAPBR=3,1,\"APN\",\"airtelgprs.com\"", "OK", 5000)) return false;
  
  // Enable the GPRS bearer
  if (!sendATCommand("AT+SAPBR=1,1", "OK", 20000)) {
     Serial.println("[ERROR] Failed to enable GPRS bearer.");
     return false;
  }
  
  // Query the bearer status to get an IP address
  if (!sendATCommand("AT+SAPBR=2,1", "OK", 10000)) {
    Serial.println("[ERROR] Failed to get IP address.");
    return false;
  }

  Serial.println("\n--- SIM Initialized and GPRS Connected ---");
  return true;
}

/**
 * @brief Performs an HTTP GET request to the configured server to get mission details.
 */
void getCustomerDetails() {
  Serial.println("\n--- Performing HTTP GET Request ---");
  
  if (!sendATCommand("AT+HTTPINIT", "OK", 5000)) return;
  if (!sendATCommand("AT+HTTPPARA=\"CID\",1", "OK", 5000)) return;

  // ** THE FIX IS HERE: ENABLE SSL FOR HTTPS URLS **
  if (String(SERVER_URL).startsWith("https")) {
    Serial.println("HTTPS URL detected. Enabling SSL.");
    if (!sendATCommand("AT+HTTPSSL=1", "OK", 5000)) {
      Serial.println("[ERROR] Failed to enable SSL.");
      sendATCommand("AT+HTTPTERM", "OK", 2000);
      return;
    }
  }

  String url_cmd = "AT+HTTPPARA=\"URL\",\"";
  url_cmd += SERVER_URL;
  url_cmd += "\"";
  if (!sendATCommand(url_cmd.c_str(), "OK", 5000)) {
    sendATCommand("AT+HTTPTERM", "OK", 2000);
    return;
  }

  // Perform the GET action. Wait up to 30 seconds for the response.
  if (!sendATCommand("AT+HTTPACTION=0", "+HTTPACTION: 0,200", 30000)) {
    Serial.println("[ERROR] HTTP GET failed. Check server or URL.");
    sendATCommand("AT+HTTPTERM", "OK", 2000);
    return;
  }
  
  sendATCommand("AT+HTTPREAD", "+HTTPREAD", 10000);
  String jsonResponse = readHttpResponse();
  sendATCommand("AT+HTTPTERM", "OK", 2000); // Terminate HTTP session

  Serial.println("\nExtracted JSON: " + jsonResponse);
  
  if (jsonResponse.length() > 2) { // Check for more than just "{}"
    DynamicJsonDocument doc(256);
    DeserializationError error = deserializeJson(doc, jsonResponse);

    if (error) {
      Serial.print("[ERROR] JSON Parsing Failed: ");
      Serial.println(error.f_str());
      return;
    }

    if (doc.containsKey("latitude") && doc.containsKey("longitude")) {
      float latitude = doc["latitude"];
      float longitude = doc["longitude"];
      const char* orderId = doc["orderId"];

      Serial.println("\n✅ --- Mission Details Received! --- ✅");
      Serial.print("Order ID:  ");
      Serial.println(orderId);
      Serial.print("Latitude:  ");
      Serial.println(latitude, 6); // Print with 6 decimal places
      Serial.print("Longitude: ");
      Serial.println(longitude, 6);
      Serial.println("------------------------------------");
    } else {
      Serial.println("[INFO] Response received, but it's empty. No mission available.");
    }
  } else {
    Serial.println("[ERROR] No valid JSON object found in response.");
  }
}

// --- Arduino Standard Functions ---
void setup() {
  Serial.begin(9600);
  while (!Serial); // Wait for Serial monitor to open

  if (initializeSIM()) {
    Serial.println("\nSystem Ready.");
    Serial.println("Type 'g' and press Enter to get the mission details.");
  } else {
    Serial.println("\n[FATAL] Initialization failed. Check wiring and power. Halting.");
    while (true); // Stop execution
  }
}

void loop() {
  if (Serial.available()) {
    char cmd = tolower(Serial.read());
    if (cmd == 'g') {
      getCustomerDetails();
    }
  }

  // Pass-through for any unexpected messages from SIM800L
  while (sim.available()) {
    Serial.write(sim.read());
  }
}
