import sys
import Ice
import Demo

# Initialize Ice communicator with configuration file
with Ice.initialize(sys.argv) as communicator:
    greet_prx = communicator.stringToProxy(f"greet:tcp -h 127.0.0.2 -p 10000 -z : udp -h 127.0.0.2 -p 10000 -z")
    guest_prx = communicator.stringToProxy(f"guest:tcp -h 127.0.0.2 -p 10000 -z : udp -h 127.0.0.2 -p 10000 -z")
    dynamic_guest_prox = communicator.stringToProxy(f"dedicated/moja-ksiazka2:tcp -h 127.0.0.2 -p 10000 -z : udp -h 127.0.0.2 -p 10000 -z")

    greet = Demo.GreetPrx.checkedCast(greet_prx)
    guest = Demo.GuestBookPrx.checkedCast(guest_prx)
    dynamic_guest = Demo.GuestBookPrx.checkedCast(dynamic_guest_prox)

    # print(greet.greetMsg("mark"))
    # print(guest.read())
    # guest.write('mikolaj wielgos')
    # print(guest.read())
    print("before write:", dynamic_guest.read())
    dynamic_guest.write('mikolaj waaielgos')
    print("after write: ", dynamic_guest.read())