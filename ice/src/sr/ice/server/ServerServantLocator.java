package sr.ice.server;

import com.zeroc.Ice.*;
import com.zeroc.Ice.Object;

public class ServerServantLocator implements com.zeroc.Ice.ServantLocator {

    @Override
    public LocateResult locate(Current current) throws UserException {
        if (!current.id.category.equals("dedicated")){
            return new LocateResult(null, null);
        }
        System.out.println("Non existing, creating for: " + current.id.category + current.id.name);
        GuestBook guestBookServant = new GuestBook();
        current.adapter.add(guestBookServant, new Identity(current.id.name, current.id.category));
        return new LocateResult(guestBookServant, null);
    }

    @Override
    public void finished(Current current, Object object, java.lang.Object o) throws UserException {

    }

    @Override
    public void deactivate(String s) {

    }
}
