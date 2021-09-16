import sys
import random

num_generals = int(sys.argv[1])
num_moments = int(sys.argv[2])
num_msg = int(sys.argv[3])
num_msg_by_moment = num_msg // num_moments

print('"moment","source","target","status"')
for moment in range(num_moments):
    for msg in range(num_msg_by_moment):
        source = random.randint(0, num_generals)
        target = random.randint(0, num_generals)
        while target == source:
            target = random.randint(0, num_generals)
        print(f"{moment},{source},{target},{random.randint(1, 3)}")

# print(f'{num_generals}_generals_{num_moments}_moments_{num_msg}_messages.csv')
