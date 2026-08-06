from ultralytics import YOLO

def main():
    model = YOLO("yolo11n.pt")

    model.train(
        data="data.yaml",
        epochs=10000,
        imgsz=3000,
        device="cuda",
        batch=4,
        half=True,
        workers=2
    )

    model.save("tree_detector.pt")

if __name__ == "__main__":
    main()