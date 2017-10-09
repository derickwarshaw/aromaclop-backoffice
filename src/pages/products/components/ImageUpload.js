import React from "react";
import proptypes from "prop-types";

import "../styles/imageupload.css";

export default class ImageUpload extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      imagePreviewUrl: props.imagePreviewUrl
    };
  }

  _handleImageChange(e) {
    e.preventDefault();

    if (!e.target.files.length) {
      this.setState({ imagePreviewUrl: "" });
      return;
    }

    const reader = new FileReader();
    const file = e.target.files[0];

    reader.onloadend = () => {
      this.props.onImageSelected({
        file: file,
        imagePreviewUrl: reader.result
      });
      this.setState({ imagePreviewUrl: reader.result });
    };

    reader.readAsDataURL(file);
  }

  render() {
    const { imagePreviewUrl } = this.state;
    const imagePreview = imagePreviewUrl ? (
      <img
        alt="preview"
        style={{ margin: 20, height: 60, width: 60 }}
        src={imagePreviewUrl}
      />
    ) : (
      <div className="Imageupload-previewText">
        Prévisualisation de l'image..
      </div>
    );

    return (
      <div className="Imageupload-container">
        <label className="Imageupload-label">Image du produit</label>
        <input type="file" onChange={e => this._handleImageChange(e)} />
        <div className="imgPreview">{imagePreview}</div>
      </div>
    );
  }
}

ImageUpload.proptypes = {
  onImageSelected: proptypes.func,
  imagePreviewUrl: proptypes.string
};

ImageUpload.defaultProps = {
  imagePreviewUrl: ""
};
