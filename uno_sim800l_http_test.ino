#include <SoftwareSerial.h>
#include <ArduinoJson.h>

// --- IMPORTANT: CONFIGURE THESE ---
const char* APN = "airtelgprs.com";       // APN for Airtel India. Change if you use a different carrier.
const char* SERVER_IP = "192.168.1.35"; // This is your computer's local IP address.

SoftwareSerial sim(10, 11);  // SIM800L TX -> 10, RX <- 11

void setup() {
  Serial.begin(9600);
  sim.begin(9600);
  delay(1000);

  Serial.println("System Initialized.");
  Serial.println("Type 'g' to GET customer details from server.");
}

void loop() {
  if (Serial.available()) {
    char cmd = Serial.read();
    if (cmd == 'g') getCustomerDetails();
  }

  // Forward messages from SIM800L to Serial Monitor
  while (sim.available()) {
    Serial.write(sim.read());
  }
}

void getCustomerDetails() {
  Serial.println("Initializing HTTP for GET request...");
  sim.println("AT+HTTPINIT");
  delay(1000);
  if (sim.find("OK")) {
    Serial.println("HTTP Initialized.");
  }

  sim.println("AT+HTTPPARA=\"CID\",1");
  delay(1000);
  if (sim.find("OK")) {
    Serial.println("CID Parameter Set.");
  }

  String url = "http://" + String(SERVER_IP) + ":9002/api/getMission?droneId=SB-001";
  Serial.print("Requesting URL: ");
  Serial.println(url);
  
  sim.print("AT+HTTPPARA=\"URL\",\"");
  sim.print(url);
  sim.println("\"");
  delay(2000);
  if (sim.find("OK")) {
    Serial.println("URL Parameter Set.");
  }
  
  Serial.println("Performing HTTP GET Action...");
  sim.println("AT+HTTPACTION=0");
  delay(3000); // Wait for action to complete

  Serial.println("Reading HTTP Response...");
  sim.println("AT+HTTPREAD");
  delay(1000);

  // --- NEW CODE: Read and parse the response ---
  String response;
  long time = millis();
  while ((time + 3000) > millis()) { // Wait up to 3 seconds for response
    while (sim.available()) {
      char c = sim.read();
      response += c;
    }
  }

  Serial.print("Full Server Response: ");
  Serial.println(response);

  // Find the start of the JSON object
  int jsonStart = response.indexOf('{');
  if (jsonStart != -1) {
    String jsonResponse = response.substring(jsonStart);
    
    // Create a JSON document to hold the data
    StaticJsonDocument<256> doc; // Adjust size if needed

    // Parse the JSON
    DeserializationError error = deserializeJson(doc, jsonResponse);

    if (error) {
      Serial.print(F("deserializeJson() failed: "));
      Serial.println(error.f_str());
    } else {
      // Extract values
      const char* orderId = doc["orderId"];
      double latitude = doc["latitude"];
      double longitude = doc["longitude"];

      Serial.println("\n--- Mission Details Parsed ---");
      Serial.print("Order ID: ");
      Serial.println(orderId);
      Serial.print("Latitude: ");
      Serial.println(latitude, 6); // Print with 6 decimal places
      Serial.print("Longitude: ");
      Serial.println(longitude, 6);
      Serial.println("----------------------------\n");
    }
  } else {
    Serial.println("No JSON object found in response. Is there a mission for this drone?");
  }
  
  sim.println("AT+HTTPTERM"); // Terminate HTTP
  delay(500);
}
