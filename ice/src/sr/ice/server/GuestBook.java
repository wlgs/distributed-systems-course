package sr.ice.server;

import com.zeroc.Ice.Current;

import java.util.ArrayList;

public class GuestBook implements Demo.GuestBook{


    private ArrayList<String> guestList = new ArrayList<>();

    @Override
    public void write(String msg, Current current) {
        this.guestList.add(msg);
    }

    @Override
    public String[] read(Current current) {
        return this.guestList.toArray(new String[0]);
    }
}
