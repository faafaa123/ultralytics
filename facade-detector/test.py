from ultralytics import YOLO

def main():

    # Load a pretrained model
    model = YOLO("yolov8n.pt")

    # Train the model on the COCO8 dataset for 100 epochs
    train_results = model.train(
        data="data.yaml",  # Path to dataset configuration file
        epochs=8,  # Number of training epochs
        imgsz=640,  # Image size for training
        device="cuda",  # Device to run on (e.g., 'cpu', 0, [0,1,2,3]); 'cuda' means that cuda manages the gpu/s
        batch=1,
        half=True,
        workers=0
    )

    # Evaluate the model's performance on the validation set
    metrics = model.val()

    # Perform object detection on an image
    results = model("house2.jpg")  # Predict on an image
    results[0].show()  # Display results

    # Export the model for deployment
    # path = model.export(format="tf")  # Returns the path to the exported model

if __name__ == "__main__":
    main()