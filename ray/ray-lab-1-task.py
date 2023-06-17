# based on the ray tutorial

# Ray enables arbitrary functions to be executed asynchronously on separate
# Python workers. These asynchronous Ray functions are called “tasks.” You
# can specify task's resource requirements in terms of CPUs, GPUs, and custom
# resources. These resource requests are used by the cluster scheduler to
# distribute tasks across the cluster for parallelized execution.

# importing framework

import os
import time
import logging

import numpy as np
from numpy import loadtxt
import ray
import cProfile

if ray.is_initialized:
    ray.shutdown()
ray.init(logging_level=logging.ERROR)

# Excercises 1.1)Try using local bubble sort and remote bubble sort,
# show difference

SAMPLE_SIZE = 10000

def bubble_sort(arr):
    for i in range(len(arr)):
        for j in range(len(arr)-1-i):
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]
    print(arr[::SAMPLE_SIZE//10])
    return arr

arr = np.random.randint(0, 100, SAMPLE_SIZE)
print('local run')
cProfile.run("bubble_sort(arr)")

print('remote run')

def remote_run(arr2):
    def flatten(l):
        return [item for sublist in l for item in sublist]
    
    @ray.remote
    def bubble_sort2(arr):
            for i in range(len(arr)):
                for j in range(len(arr)-1-i):
                    if arr[j] > arr[j+1]:
                        arr[j], arr[j+1] = arr[j+1], arr[j]
            return arr
    
    arr2 = np.array_split(arr, os.cpu_count())
    results = [
        bubble_sort2.remote(arr_ref)
        for arr_ref in arr2
    ]
    chunks_to_sort = ray.get(results)
    final_result = bubble_sort2.remote(flatten(chunks_to_sort))
    print(ray.get(final_result)[::SAMPLE_SIZE//10])
    return ray.get(final_result)

arr2 = np.random.randint(0, 100, SAMPLE_SIZE)
cProfile.run("remote_run(arr2)")

ray.shutdown()
