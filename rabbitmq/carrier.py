import pika
import time
connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
channel = connection.channel()

def process_admin_message(ch, method, properties, body):
    print("[ADMIN]:", str(body, 'utf-8'))

def process_agency_request(ch, method, properties, body):
    print("[JOB]:", method.routing_key, ": ", str(body, 'utf-8'), "... ", end="", flush=True)
    agency_name =  str(body, 'utf-8').split('=')[0]
    time.sleep(5)
    print("Done!")
    ch.basic_ack(delivery_tag=method.delivery_tag)
    channel.basic_publish(
        exchange='message_exchange',
        routing_key='agency.' + agency_name,
        body='carrier=' + carrier_name + ' completed.'
    )

# Message exchange
channel.exchange_declare(exchange='message_exchange', exchange_type='topic')

carrier_name = input("0. Carrier name: ")
queue_name = 'carrier_message_' + carrier_name + '_queue'

# Message exchange
channel.queue_declare(queue=queue_name)
channel.queue_bind(exchange='message_exchange', queue=queue_name, routing_key='carrier.' + carrier_name)
channel.queue_bind(exchange='message_exchange', queue=queue_name, routing_key='carrier.all')
channel.queue_bind(exchange='message_exchange', queue=queue_name, routing_key='all')
channel.basic_consume(queue=queue_name, on_message_callback=process_admin_message, auto_ack=True)

# Service exchange
channel.exchange_declare(exchange='services_exchange', exchange_type='direct')
channel.queue_declare(queue='service_queue')

service_type = input("1. Service (people|cargo|satellite): ")
channel.queue_declare(queue=service_type + '_queue')
channel.queue_bind(exchange='services_exchange', queue=service_type + '_queue', routing_key=service_type)
channel.basic_consume(queue=service_type + '_queue', on_message_callback=process_agency_request, auto_ack=False)

service_type = input("2. Service (people|cargo|satellite): ")
channel.queue_declare(queue=service_type + '_queue')
channel.queue_bind(exchange='services_exchange', queue=service_type + '_queue', routing_key=service_type)
channel.basic_consume(queue=service_type + '_queue', on_message_callback=process_agency_request, auto_ack=False)

channel.start_consuming()
connection.close()  