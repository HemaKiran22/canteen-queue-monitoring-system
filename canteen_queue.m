function queue_monitor()
    clc;
    clear;
    close all;

    % Load YOLOv8 small model
    detector = yolov8ObjectDetector('yolov8s');

    % Choose Input Source
    choice = input('Enter 1 for Video File, 2 for Live Camera: ');

    if choice == 1
        % Load video file
        videoFile = 'canteen2.mp4';  
        videoReader = VideoReader(videoFile);
        isLive = false;
    elseif choice == 2
        % Access live camera
        cam = webcam;
        isLive = true;
    else
        disp('Invalid choice! Exiting program.');
        return;
    end

    % Create a video player to display the output
    videoPlayer = vision.DeployableVideoPlayer;

    % Define estimated time per person in queue
    minTimePerPerson = 20; % Fastest service time (seconds)
    maxTimePerPerson = 40; % Slowest service time (seconds)

    % Set confidence threshold for better detection accuracy
    threshold = 0.5; 

    % Initialize queue history for trend visualization
    queueHistory = [];

    % Open file for logging queue data (optional)
    fileID = fopen('queue_log.txt', 'a');

    % Next.js API configuration
    api_url = 'https://canteen-queue-monitoring-system.vercel.app/api/queue';
    webOptions = weboptions(...
        'MediaType', 'application/json', ...
        'Timeout', 2, ...
        'RequestMethod', 'post', ...
        'HeaderFields', {'Content-Type' 'application/json'} ...
    );

    % Processing loop
    while true
        % Capture frame from the selected input
        if isLive
            frame = snapshot(cam);  % Capture frame from webcam
        else
            if hasFrame(videoReader)
                frame = readFrame(videoReader);
            else
                break; % Exit loop if video ends
            end
        end

        % Perform object detection
        [bboxes, scores, labels] = detect(detector, frame);

        % Filter only 'person' class with confidence threshold
        personIndices = labels == "person" & scores > threshold;
        personBboxes = bboxes(personIndices, :);
        personScores = scores(personIndices);

        % Count number of people detected
        numPeople = size(personBboxes, 1);

        % Calculate estimated waiting time range
        minWaitTime = numPeople * minTimePerPerson;
        maxWaitTime = numPeople * maxTimePerPerson;

        % ================================================
        % Send data to Next.js dashboard
        % ================================================
        try
            payload = struct(...
                'students', numPeople, ...
                'minWait', minWaitTime, ...
                'maxWait', maxWaitTime ...
            );
            jsonPayload = jsonencode(payload);
            webwrite(api_url, jsonPayload, webOptions);
            disp('Data sent to Next.js dashboard successfully.');
        catch ME
            disp('Error sending data:');
            disp(ME.message);
        end

        % ================================================
        % Display annotations (optional)
        % ================================================
        if ~isempty(personBboxes)
            annotatedFrame = insertObjectAnnotation(frame, 'rectangle', personBboxes, ...
                strcat('Person: ', string(personScores)), 'Color', 'green', 'LineWidth', 3);
        else
            annotatedFrame = frame;
        end

        % Display student count on the frame
        annotatedFrame = insertText(annotatedFrame, [10, 30], ...
            ['Students in Queue: ', num2str(numPeople)], ...
            'FontSize', 60, 'BoxColor', 'blue', 'TextColor', 'white');

        % Display estimated waiting time range
        annotatedFrame = insertText(annotatedFrame, [20, 120], ...
            ['Wait Time: ', num2str(minWaitTime), '-', num2str(maxWaitTime), ' sec'], ...
            'FontSize', 48, 'BoxColor', 'red', 'TextColor', 'white');

        % Show the processed video frame
        step(videoPlayer, annotatedFrame);

        % ================================================
        % Logging and visualization (optional)
        % ================================================
        % Log data to file
        fprintf(fileID, 'Time: %s, Students: %d, Wait Time: %d - %d sec\n', ...
            datestr(now, 'HH:MM:SS'), numPeople, minWaitTime, maxWaitTime);

        % Update queue history for trend visualization
        queueHistory = [queueHistory, numPeople];
        
        % Plot queue trend over time
        figure(1); clf;
        plot(queueHistory, '-o', 'LineWidth', 2);
        xlabel('Time (Frames)');
        ylabel('Queue Length');
        title('Queue Length Over Time');
        grid on;
        drawnow;

        % Pause for smooth visualization
        pause(0.05);
    end

    % Cleanup
    fclose(fileID);
    release(videoPlayer);
    if isLive
        clear cam;
    end
end
