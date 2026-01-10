import socket
import sys

hostname = "db.sxuotvogwvmxuvwbsscv.supabase.co"

print(f"Resolving {hostname}...")
try:
    info = socket.getaddrinfo(hostname, 5432)
    for res in info:
        print(f"Family: {res[0]}, Address: {res[4]}")
except Exception as e:
    print(f"Error: {e}")
