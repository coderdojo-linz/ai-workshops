import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Random;

public class Main {



        static class VideoRecord {
            String videoId;
            String gpsCoordinates;
            String status;
            int views;

            public VideoRecord(String videoId, String gpsCoordinates, String status, int views) {
                this.videoId = videoId;
                this.gpsCoordinates = gpsCoordinates;
                this.status = status;
                this.views = views;
            }

            @Override
            public String toString() {
                return videoId + " | " + gpsCoordinates + " | " + status + " | " + views;
            }
        }

        public static void main(String[] args) {
            int datasetSize = 1000;
            List<VideoRecord> dataset = new ArrayList<>();
            Random rand = new Random();

            // 3 feste GPS-Koordinaten für HIDDEN die gefunden werden müssen
            List<String> hiddenCoords = Arrays.asList(
                    "48.13743, 11.57549", // München
                    "52.52000, 13.40500", // Berlin
                    "50.11092, 8.68213"   // Frankfurt
            );

            for (int i = 0; i < datasetSize; i++) {
                String videoId = "VID" + (i + 1);


                boolean isHidden = rand.nextDouble() < 0.2;
                String gps;
                String status;
                int views;

                if (isHidden) {
                    gps = hiddenCoords.get(rand.nextInt(hiddenCoords.size()));
                    status = "HIDDEN";
                    views = 0;
                } else {
                    double lat = -90 + (90 - (-90)) * rand.nextDouble();
                    double lon = -180 + (180 - (-180)) * rand.nextDouble();
                    gps = String.format("%.5f, %.5f", lat, lon);
                    status = "OK";
                    views = rand.nextInt(10000);
                }

                dataset.add(new VideoRecord(videoId, gps, status, views));
            }


            dataset.stream().forEach(System.out::println);

        }
    }

