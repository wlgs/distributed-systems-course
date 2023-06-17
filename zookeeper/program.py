import time
from kazoo.client import KazooClient
import tkinter as tk
from tkinter import ttk

ZNODE_PATH = "/z"


    
class ZooKeeperApp:
    def __init__(self):
        self.create_gui()
        self.children = []

    def start_zookeeper(self):
        print("zookeeper started")
        self.zk = KazooClient(hosts='127.0.0.1:2181')
        self.zk.start()
        print("zookeeper running")
        if (self.zk.exists(ZNODE_PATH, watch=self.on_node_changed)):
            self.root.deiconify()
            self.zk.ChildrenWatch(ZNODE_PATH)(lambda children: self.on_children_changed(ZNODE_PATH, children))
        
    def on_node_changed(self, event):
        print("Node changed: " + str(event))
        if event.type == "DELETED":
            self.zk.exists(ZNODE_PATH, watch=self.on_node_changed)
            self.root.withdraw()
        elif event.type == "CREATED":
            self.zk.exists(ZNODE_PATH, watch=self.on_node_changed)
            self.zk.ChildrenWatch(ZNODE_PATH)(lambda children: self.on_children_changed(ZNODE_PATH, children))
            self.root.deiconify()
        
    def on_children_changed(self, path, children):
        for child in children:
            child_path = f"/{path}/{child}"
            self.zk.ChildrenWatch(child_path)(lambda children: self.on_children_changed(child_path, children))
        self.update_children()
        self.update_treeview()

    def create_gui(self):
        self.root = tk.Tk()
        self.root.withdraw()
        self.root.title("ZooKeeper App")
        self.child_count_label = tk.Label(self.root, text="Current number of children: 0")
        self.child_count_label.pack()
        self.children_listbox = tk.Listbox(self.root)
        self.children_listbox.pack()

        self.treeview = ttk.Treeview(self.root)
        self.treeview.heading("#0", text="Node Structure", anchor="w")
        self.treeview.pack()

        self.root.after(1000, self.start_zookeeper)
        self.root.mainloop()

    def destroy_gui(self):
        self.root.destroy()
        
    def update_children(self):
        print("Updating children")
        try:
            self.children = self.zk.get_children(ZNODE_PATH)
        except Exception:
            self.children = []
            return

        self.child_count_label.config(text="Current number of children: " + str(len(self.children)))
        self.children_listbox.delete(0, tk.END)
        for child in self.children:
            self.children_listbox.insert(tk.END, child)


    def update_treeview(self):
        print("Updating treeview")
        self.treeview.delete(*self.treeview.get_children())
        self.populate_treeview(ZNODE_PATH, "")

    def populate_treeview(self, node, parent):
        node_id = self.treeview.insert(parent, "end", text=node, open=True)
        children = self.zk.get_children(node)
        for child in children:
            child_path = f"{node}/{child}"
            self.populate_treeview(child_path, node_id)

if __name__ == "__main__":
    app = ZooKeeperApp()