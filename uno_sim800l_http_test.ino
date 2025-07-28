#include <SoftwareSerial.h>

// --- IMPORTANT: CONFIGURE THESE ---
// The APN (Access Point Name) for your SIM card's mobile carrier.
// "airtelgprs.com" is a common one for Airtel in India.
const char* APN = "airtelgprs.com"; 

// The local IP address of the computer running your Next.js server.
const char* SERVER_IP = "192.168.1.35"; // Updated with your Mac's IP address.


// -- Hardware Pins --
SoftwareSerial sim(10, 11);  // SIM800L TX -> 10, RX <- 11
String number = "+918073667200"; // Change to your own number for SMS/Call tests

void setup() {
  Serial.begin(9600);
  sim.begin(9600);
  delay(1000);

  Serial.println("System Initialized.");
  Serial.println("Type 's' to send SMS, 'r' to receive SMS, 'c' to call, or 'g' to get customer data.");
}

void loop() {
  if (Serial.available()) {
    char cmd = Serial.read();
    if (cmd == 's') SendMessage();
    else if (cmd == 'r') ReceiveMessage();
    else if (cmd == 'c') callNumber();
    else if (cmd == 'g') getCustomerDetails();
  }

  // Forward messages from SIM800L to Serial Monitor
  while (sim.available()) {
    Serial.write(sim.read());
  }
}

// Function to perform HTTP GET request
void getCustomerDetails() {
  Serial.println("Initializing GPRS...");
  sim.println("AT+SAPBR=3,1,\"APN\",\"" + String(APN) + "\"");
  delay(2000);
  printResponse();

  sim.println("AT+SAPBR=1,1"); // Enable GPRS
  delay(3000);
  printResponse();

  Serial.println("Initializing HTTP...");
  sim.println("AT+HTTPINIT");
  delay(2000);
  printResponse();

  String url = "http://" + String(SERVER_IP) + ":9002/api/getMission?droneId=SB-001";
  Serial.println("Setting URL: " + url);
  sim.println("AT+HTTPPARA=\"URL\",\"" + url + "\"");
  delay(2000);
  printResponse();

  Serial.println("Performing GET request...");
  sim.println("AT+HTTPACTION=0"); // 0 for GET
  delay(5000); // Wait for the action to complete
  printResponse(); 

  Serial.println("Reading response...");
  sim.println("AT+HTTPREAD");
  delay(3000);
  printResponse();

  Serial.println("Terminating HTTP...");
  sim.println("AT+HTTPTERM");
  delay(1000);
  printResponse();

  Serial.println("Disabling GPRS...");
  sim.println("AT+SAPBR=0,1");
  delay(2000);
  printResponse();
  
  Serial.println("--- Test Complete ---");
}

// Helper function to print SIM800L responses to Serial Monitor
void printResponse() {
  while (sim.available()) {
    Serial.write(sim.read());
  }
}


void SendMessage() {
  Serial.println("Sending SMS...");

  sim.println("AT+CMGF=1"); // Set text mode
  delay(500);

  sim.print("AT+CMGS=\"");
  sim.print(number);
  sim.println("\"");
  delay(1000); // Wait for '>'

  sim.print("Hello");
  delay(500);
  sim.write(26); // Send Ctrl+Z
  delay(5000);

  Serial.println("SMS Sent.");
}

void ReceiveMessage() {
  Serial.println("Listening for incoming SMS...");
  sim.println("AT+CMGF=1");        // Set text mode
  delay(200);
  sim.println("AT+CNMI=1,2,0,0,0"); // Show SMS on serial immediately
  delay(1000);
}

void callNumber() {
  Serial.println("Dialing...");
  sim.print("ATD");
  sim.print(number);
  sim.println(";");
  delay(10000); // Let it ring for 10 seconds
  sim.println("ATH"); // Hang up
  Serial.println("Call ended.");
}