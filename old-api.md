
##### Create VM
```bash
# Create new VM and run it

# name: only english chars
# version: ['sonoma']
curl -X POST http://$HOST/api/vms/create -d '{
  "name": "myVmName",
  "version": "sonoma"
}'
```

##### Stop exist VM
```bash
# Stop VM

# myVmName = yor vm name
curl -X POST http://$HOST/api/vms/myVmName/stop
```

##### Start exist VM after stop it
```bash
# Run VM when VM stopped

# myVmName = yor vm name
curl -X POST http://$HOST/api/vms/myVmName/start
```

##### Get all exists VM (not snapshots!)
```bash
# Get all VM

curl -X POST http://$HOST/api/vms/list
```

##### Get all exists disks
```bash
# Get all disks list

curl -X POST http://$HOST/api/resources/disks/list
```

##### Get all snapshots
```bash
# Get all snapshots list

curl -X POST http://$HOST/api/resources/snapshots/list
```
(you can run it via '/api/vms/***/start')
