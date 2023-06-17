module Demo {

  sequence<string> GuestList;

  interface GuestBook {
    void write(string msg);
    idempotent GuestList read();
  };

  interface Greet {
    idempotent string greetMsg(string msg);
  };
};