"""Full prerelease version must agree across the header, cache and metadata."""
import ast
import json
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
COMPONENT = ROOT / 'custom_components/nikas_ho_sc_8w'
VERSION = re.compile(r'\d+\.\d+\.\d+(-beta\d{3})?')


class ReleaseVersionDisplayTests(unittest.TestCase):
    def test_beta_suffix_is_not_hidden_from_the_ui_version(self):
        integration = json.loads((COMPONENT / 'manifest.json').read_text())['version']
        ui = json.loads((ROOT / '.nikas-ui-standard.json').read_text())['ui_version']
        self.assertIsNotNone(VERSION.fullmatch(integration))
        self.assertIsNotNone(VERSION.fullmatch(ui))
        self.assertEqual(VERSION.fullmatch(ui)[1], VERSION.fullmatch(integration)[1],
                         'Header UI version must retain the integration betaNNN suffix')

    def test_header_assets_and_panel_registration_share_full_version(self):
        ui = json.loads((ROOT / '.nikas-ui-standard.json').read_text())['ui_version']
        constants = ast.parse((COMPONENT / 'const.py').read_text())
        panel_version = next(ast.literal_eval(node.value) for node in constants.body
                             if isinstance(node, ast.Assign)
                             and any(isinstance(t, ast.Name) and t.id == 'PANEL_VERSION' for t in node.targets))
        self.assertEqual(panel_version, ui)
        self.assertEqual(json.loads((ROOT / 'panel.json').read_text())['panel']['dashboard_version'], ui)
        self.assertEqual(json.loads((ROOT / 'panel_manifest.json').read_text())['panel_version'], ui)
        source = (COMPONENT / 'frontend/irrigation-panel.js').read_text()
        self.assertIn(f'const NIKAS_HO_SC_8W_UI_VERSION = "{ui}";', source)
        self.assertIn('UI v${NIKAS_HO_SC_8W_UI_VERSION}', source)
        self.assertIn('const ASSET_VERSION = UI_VERSION;', source)
        registration = (COMPONENT / 'frontend.py').read_text()
        self.assertIn('module_url=f"{PANEL_JS_URL}?v={PANEL_VERSION}"', registration)
        self.assertEqual(json.loads((ROOT / 'panel_manifest.json').read_text())['integration_version'],
                         json.loads((COMPONENT / 'manifest.json').read_text())['version'])


if __name__ == '__main__':
    unittest.main()
