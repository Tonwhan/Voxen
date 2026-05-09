import os
import logging
import trimesh

logger = logging.getLogger(__name__)

class CADExporter:
    def __init__(self, export_dir="exports"):
        self.export_dir = export_dir
        if not os.path.exists(self.export_dir):
            os.makedirs(self.export_dir)

    def export_scene(self, scene, filename, format="stl"):
        """
        Exports a trimesh Scene to a file.
        """
        if format.lower() not in ["stl", "obj"]:
            raise ValueError(f"Unsupported format: {format}")
            
        filepath = os.path.join(self.export_dir, f"{filename}.{format.lower()}")
        
        # STL usually expects a single mesh, but trimesh handles scene exports gracefully usually.
        # If STL fails on scenes, we merge them.
        if format.lower() == "stl":
            merged = scene.dump(concatenate=True)
            if isinstance(merged, trimesh.Trimesh):
                merged.export(filepath)
            else:
                scene.export(filepath)
        else:
            scene.export(filepath)
            
        return filepath
