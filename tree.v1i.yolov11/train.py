from ultralytics import YOLO

def main():
    model = YOLO("yolo11n.pt")

    model.train(
        data="data.yaml",
        epochs=64,
        imgsz=640,
        device="cuda",
        batch=1,
        half=True,
        workers=0
    )

    model.save("tree_detector.pt")

if __name__ == "__main__":
    main()