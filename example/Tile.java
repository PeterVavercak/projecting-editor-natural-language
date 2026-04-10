package sk.tuke.gamestudio.NumberLink.Core;

import java.util.HashSet;
import java.util.Iterator;

/*#nlregion
----
Class representing a road connecting two destinations with a set of paths
----
- Each road has a unique index and connects two destinations.
- Paths can be added or removed from the road.
- Provides methods to check connectivity and manage the state of destinations and paths.

----
Methods:
- 'Road(int roadIndex, int[][] positions, Tile[][] tiles)': Constructor initializes the road with destinations and their positions.
- 'getPathIterator()': Returns an iterator for the paths in the road.
- 'addPath(Path path)': Adds a path to the road.
- 'removePath(Path path)': Removes a path from the road.
- 'isConnected()': Checks if the road is fully connected.
- 'completeDestinations()': Marks destinations as connected if the road is fully connected.
- 'disconnectAllTiles()': Disconnects all tiles and paths associated with the road.
- 'disconnectFollowingTiles(Connectable tile)': Disconnects tiles following a given tile.

----
Returns:
- 'isConnected': Boolean indicating if the road is fully connected.
- 'getPathIterator': Iterator for the paths in the road.
----
#endnlregion*/
//#region
public class Road {
    private int roadIndex;
    private HashSet<Path> paths;
    private Tile[][] tiles;
    private int[][] positions;

    public Road(int roadIndex, int[][] positions, Tile[][] tiles) {
        this.roadIndex = roadIndex;
        this.positions = positions;
        this.tiles = tiles;
        this.paths = new HashSet<>();
    }

    public Iterator<Path> getPathIterator() {
        return paths.iterator();
    }

    public void addPath(Path path) {
        paths.add(path);
    }

    public void removePath(Path path) {
        paths.remove(path);
    }

    public boolean isConnected() {
        // Logic to check if the road is fully connected
        return false; // Placeholder
    }

    public void completeDestinations() {
        if (isConnected()) {
            // Logic to mark destinations as connected
        }
    }

    public void disconnectAllTiles() {
        for (Path path : paths) {
            path.disconnect();
        }
        paths.clear();
    }

    public void disconnectFollowingTiles(Connectable tile) {
        // Logic to disconnect tiles following the given tile
    }
}
//#endregion


