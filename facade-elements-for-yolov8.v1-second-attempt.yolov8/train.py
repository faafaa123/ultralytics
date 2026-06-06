from ultralytics import YOLO

def main():
    model = YOLO("yolov8n.pt")

    model.train(
        data="data.yaml",
        epochs=1,
        imgsz=640,
        device="cuda",
        batch=1,
        half=True,
        workers=0
    )

    model.save("window_detector.pt")

if __name__ == "__main__":
    main()