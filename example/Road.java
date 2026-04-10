package sk.tuke.gamestudio.NumberLink.Core;

import java.util.HashSet;
import java.util.Iterator;

/*#NaturalLanguage
# ----
# Class to represent a road with destinations and paths
# ----
# Constructor:
# - Initializes road with an index, positions of two destinations, and tiles
# - Creates two destinations and assigns them to the tiles
# - Initializes a set to store paths
# ----
# Methods:
# - `getPathIterator`: Returns an iterator for the paths
# - `addPath`: Adds a path to the road
# - `removePath`: Removes a path from the road
# - `getRoadIndex`: Retrieves the road index
# - `getDestination1` and `getDestination2`: Retrieve the two destinations
# - `isConnected`: Checks if all paths and destinations are fully connected
# - `completeDestinations`: Marks destinations as connected if the road is fully connected
# - `disconnectAllTiles`: Disconnects all tiles, including paths and destinations
# - `disconnectFollowingTiles`: Disconnects tiles following a given tile, ensuring proper disconnection logic
# ----
#EndNaturalLanguage*/
//#region
public class Road {
    private final int roadIndex;
    private final Destination destination1;
    private final Destination destination2;
    private final HashSet<Path> pathTiles;

    //#region
    Road(int roadIndex, int[][] positions, Tile[][] tiles){
        this.roadIndex = roadIndex;

        int destination1Row = positions[0][0];
        int destination1Column = positions[0][1];
        this.destination1 = new Destination(this, destination1Row, destination1Column);
        tiles[destination1Row][destination1Column] = destination1;

        int destination2Row = positions[1][0];
        int destination2Column = positions[1][1];
        this.destination2 = new Destination(this, destination2Row, destination2Column);
        tiles[destination2Row][destination2Column] = destination2;

        this.pathTiles = new HashSet<>();

    }
    //#endregion

    //#region
    public Iterator<Path> getPathIterator() {
        return pathTiles.iterator();
    }
    //#endregion

    //#region
    public void addPath(Path path){
        pathTiles.add(path);
    }

    public void removePath(Path path){
        pathTiles.remove(path);
    }
    //#endregion
    //#region
    public int getRoadIndex() {
        return roadIndex;
    }
    public Destination getDestination1() {
        return destination1;
    }
    public Destination getDestination2() {
        return destination2;
    }
    //#endregion

    //#region
    private boolean isConnected(){
        Iterator<Path> iterator = getPathIterator();
        while(iterator.hasNext()){
            Path path = iterator.next();
            if(path.getState() != PathState.FULLYCONNECTED) {
                return false;
            }
        }
        return getDestination1().getState() == DestinationState.USING && getDestination2().getState() == DestinationState.USING;
    }
    //#endregion

    //#region
    public void completeDestinations(){
        if(isConnected()){
            getDestination1().setStateConnected();
            getDestination2().setStateConnected();
        }
    }
    //#endregion

    //#region
    public void disconnectAllTiles(){
        getDestination1().getsDisconnected();
        getDestination2().getsDisconnected();
        Iterator<Path> iterator = getPathIterator();
        while(iterator.hasNext()){
            Path path = iterator.next();
            path.getsDisconnected();
            iterator.remove();
        }

    }
    //#endregion

    //#region
    public void disconnectFollowingTiles(Connectable tile){
        if(!(tile instanceof Path) ){
            return;
        }
        Path path  = (Path) tile;
        Connectable usedTile = tile;
        if(path.getState() != PathState.FULLYCONNECTED){
            return;
        }
        Connectable nextTile = (Connectable) path.getNextConnectedTile();
        while(nextTile instanceof Path ) {
            path = (Path) nextTile;
            usedTile = nextTile;
            nextTile = (Connectable) path.getNextConnectedTile();
            removePath(path);
            usedTile.getsDisconnected();
            if(nextTile == tile){
                break;
            }

        }
        if(nextTile instanceof Destination){
            getDestination2().setStateUsing();
            getDestination1().setStateUsing();
            nextTile.getsDisconnected();
        }
    }
    //#endregion
}
//#endregion
