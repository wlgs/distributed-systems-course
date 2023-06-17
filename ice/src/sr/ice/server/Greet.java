package sr.ice.server;

import com.zeroc.Ice.Current;

public class Greet implements Demo.Greet{
    @Override
    public String greetMsg(String msg, Current current) {
        return "Hello " + msg;
    }
}
