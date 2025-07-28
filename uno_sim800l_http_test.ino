#include <SoftwareSerial.h>

// --- IMPORTANT: CONFIGURE THESE ---
// APN (Access Point Name) for your SIM card's mobile network.
// This is the gateway your SIM uses to connect to the internet.
// "airtelgprs.com" is the standard APN for Airtel in India.
const char* APN = "airtelgprs.com";

// Your computer's local IP address. The Arduino will send the HTTP request here.
// Find this by running 'ipconfig' (on Windows) or 'ifconfig' (on Mac/Linux) in your terminal.
// It will look something like "192.168.1.5" or "10.0.0.10".
// DO NOT use "localhost" or "127.0.0.1".
const char* SERVER_IP = "YOUR_COMPUTER_IP";


// --- Pin Definitions ---
SoftwareSerial sim(10, 11);  // SIM800L TX -> Arduino 10, SIM800L RX -> Arduino 11


void setup() {
  Serial.begin(9600);
  sim.begin(9600);
  delay(1000);

  Serial.println("System Initialized.");
  Serial.println("Type 'g' to perform an HTTP GET request to the server.");
}

void loop() {
  // If the user sends a command from the Serial Monitor
  if (Serial.available()) {
    char cmd = Serial.read();
    if (cmd == 'g') {
      getCustomerDetails();
    }
  }

  // Forward any messages from the SIM800L to the Serial Monitor
  while (sim.available()) {
    Serial.write(sim.read());
  }
}

void getCustomerDetails() {
  if (SERVER_IP == "YOUR_COMPUTER_IP") {
    Serial.println("ERROR: Please configure your computer's IP address in the SERVER_IP variable first!");
    return;
  }
  
  Serial.println("Starting HTTP GET Request...");

  // Sequence of AT commands for HTTP GET
  // Each command is followed by a delay to allow the module to process it.

  sendATCommand("AT", "OK", 1000);
  sendATCommand("AT+SAPBR=3,1,\"Contype\",\"GPRS\"", "OK", 1000);
  
  String apnCmd = "AT+SAPBR=3,1,\"APN\",\"";
  apnCmd += APN;
  apnCmd += "\"";
  sendATCommand(apnCmd, "OK", 1000);
  
  sendATCommand("AT+SAPBR=1,1", "OK", 2000); // Enable GPRS bearer
  sendATCommand("AT+HTTPINIT", "OK", 2000);
  sendATCommand("AT+HTTPPARA=\"CID\",1", "OK", 1000);

  String urlCmd = "AT+HTTPPARA=\"URL\",\"http://";
  urlCmd += SERVER_IP;
  urlCmd += ":9002/api/getMission?droneId=SB-001\"";
  sendATCommand(urlCmd, "OK", 1000);

  sendATCommand("AT+HTTPACTION=0", "+HTTPACTION: 0,200", 10000); // Start GET, wait for 200 OK
  sendATCommand("AT+HTTPREAD", "OK", 5000); // Read the response data
  sendATCommand("AT+HTTPTERM", "OK", 1000); // Terminate HTTP session
  sendATCommand("AT+SAPBR=0,1", "OK", 2000); // Disable GPRS bearer

  Serial.println("HTTP GET Request Finished.");
}

// Helper function to send an AT command and wait for a specific response
void sendATCommand(String cmd, const char* expected_response, unsigned int timeout) {
  String response = "";
  
  Serial.print("Sending: ");
  Serial.println(cmd);
  
  sim.println(cmd);
  
  long int time = millis();
  while ((time + timeout) > millis()) {
    while (sim.available()) {
      char c = sim.read();
      response += c;
    }
  }
  
  Serial.print("Received: ");
  Serial.println(response);

  if(response.indexOf(expected_response) != -1) {
    Serial.println("Success");
  } else {
    Serial.println("Error");
  }
}
