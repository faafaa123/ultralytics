from ultralytics import YOLO

model = YOLO("tree_detector.pt")

model.export(
    format="onnx",
    imgsz=640,
    simplify=True
)