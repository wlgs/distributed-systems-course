package sr.ice.server;

import com.zeroc.Ice.*;

import java.lang.Exception;

public class IceServer {

	public void t1(String[] args) {
		int status = 0;
		Communicator communicator = Util.initialize(args, "config.server");
		ServantLocator servantLocator = new ServerServantLocator();
		try {
			ObjectAdapter adapter = communicator.createObjectAdapter("Adapter");
			Greet greetServant = new Greet();
			GuestBook guestBook1 = new GuestBook();
			GuestBook guestBook2 = new GuestBook();
			adapter.add(greetServant, new Identity("greet", ""));
			adapter.add(guestBook1, new Identity("guest", ""));
			adapter.addServantLocator(servantLocator, "dedicated");
			adapter.addDefaultServant(guestBook2, "shared");

			adapter.activate();
			System.out.println("Entering event processing loop...");
			communicator.waitForShutdown();

		} catch (Exception e) {
			e.printStackTrace(System.err);
			status = 1;
		}
		try {
			communicator.destroy();
		} catch (Exception e) {
			e.printStackTrace(System.err);
			status = 1;
		}
		System.exit(status);
	}


	public static void main(String[] args) {
		IceServer app = new IceServer();
		app.t1(args);
	}
}