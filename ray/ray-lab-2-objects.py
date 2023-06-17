import logging
import ray

if ray.is_initialized:
    ray.shutdown()
ray.init(logging_level=logging.ERROR)

import cProfile

# Excercises 2.1) Create large lists and python dictionaries,
# put them in object store. Write a Ray task to process them.

large_list = list(range(1000000))
large_dict = {i: i for i in range(1000000)}

@ray.remote
def process_large_list(large_list):
    return sum(large_list)

@ray.remote
def process_large_dict(large_dict):
    return sum(large_dict.values())

large_list_ref = ray.put(large_list)
large_dict_ref = ray.put(large_dict)

cProfile.run("ray.get(process_large_list.remote(large_list))")
cProfile.run("ray.get(process_large_dict.remote(large_dict))")