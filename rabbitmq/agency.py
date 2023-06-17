import pika
import threading

connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
channel = connection.channel()

# Message exchange
channel.exchange_declare(exchange='message_exchange', exchange_type='topic')

agency_name = input("0. Agency name: ")
queue_name = 'agency_message_' + agency_name + '_queue'
channel.queue_declare(queue=queue_name)
channel.queue_bind(exchange='message_exchange', queue=queue_name, routing_key='agency.' + agency_name)
channel.queue_bind(exchange='message_exchange', queue=queue_name, routing_key='agency.all')
channel.queue_bind(exchange='message_exchange', queue=queue_name, routing_key='all')

# Service exchange
channel.exchange_declare(exchange='services_exchange', exchange_type='direct')
channel.queue_declare(queue='carrier_queue')

def process_admin_message(ch, method, properties, body):
    print("\n[MSG]:", str(body, 'utf-8'))
    
def process_confirm_message(ch, method, properties, body):
    print("\n[CONFIRM]:", str(body, 'utf-8'))

def on_acknowledgement(method_frame):
    confirmation_type = method_frame.method.NAME.split('.')[1].lower()
    print('[CONFIRM]:', confirmation_type, 'for', method_frame.method.delivery_tag)
    if confirmation_type == 'nack':
        print('[CONFIRM]:Message lost!')
    else:
        print('[CONFIRM]:Message received by broker!')

def start_consuming():
    channel.start_consuming()

channel.basic_consume(queue=queue_name, on_message_callback=process_admin_message, auto_ack=True)
channel._impl.add_callback(on_acknowledgement, [pika.spec.Basic.Ack, pika.spec.Basic.Nack])

consume_thread = threading.Thread(target=start_consuming)
consume_thread.start()

while True:
    job = input("(people|cargo|satellite|admin|exit=body?): ")
    if (job == 'exit'):
        break
    elif (job.split('=')[0] == 'admin'):
        channel.basic_publish(
            exchange='message_exchange',
            routing_key=job.split('=')[1],
            body=job.split('=')[2]
        )
        continue
    channel.basic_publish(
        exchange='services_exchange',
        routing_key=job.split('=')[0],
        body=agency_name + "=" + job.split('=')[1]
    )

channel.stop_consuming()
consume_thread.join()

connection.close()