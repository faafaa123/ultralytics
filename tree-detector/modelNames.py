from ultralytics import YOLO

model = YOLO("tree_detector.pt")

print(model.names)